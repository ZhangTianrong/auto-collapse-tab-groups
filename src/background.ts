interface ExtensionOptions {
  ignoreUngroupedTabs: boolean
  preserveSingleTabGroups: 'off' | 'keep-current' | 'always-expanded'
}

// Default options
let options: ExtensionOptions = {
  ignoreUngroupedTabs: true,
  preserveSingleTabGroups: 'keep-current'
}

// Load options from storage
async function loadOptions(): Promise<void> {
  const result = await chrome.storage.sync.get({
    ignoreUngroupedTabs: true,
    preserveSingleTabGroups: 'keep-current'
  })
  options = result as ExtensionOptions
}

// Listen for options changes
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'optionsUpdated') {
    loadOptions()
  }
})

// Initialize options
loadOptions()

// Debounce function with proper TypeScript typing
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait) as unknown as number
  }
}

async function updateGroups() {
  try {
    // Get all chrome windows
    const windows = await chrome.windows.getAll()

    // Handle each window separately
    for (const window of windows) {
      // Get active tab in this window
      const [activeTabInWindow] = await chrome.tabs.query({
        active: true,
        windowId: window.id
      })

      // If active tab is not in a group (groupId === -1) and ignoreUngroupedTabs is enabled,
      // skip processing tab groups in this window entirely
      if (options.ignoreUngroupedTabs && activeTabInWindow?.groupId === -1) {
        continue
      }

      // Get all groups in this window
      const windowGroups = await chrome.tabGroups.query({
        windowId: window.id
      })

      // Get all tabs in this window to check group sizes
      const windowTabs = await chrome.tabs.query({ windowId: window.id })

      // Create an array of group updates
      const updatePromises = windowGroups.map(group => {
        // Count tabs in this group
        const tabsInGroup = windowTabs.filter(tab => tab.groupId === group.id).length

        // Handle single-tab groups based on the option
        if (tabsInGroup === 1) {
          switch (options.preserveSingleTabGroups) {
            case 'off':
              // Treat like any other group
              break
            case 'keep-current':
              // Skip updating this group
              return null
            case 'always-expanded':
              // Always ensure the group is expanded
              if (group.collapsed) {
                return chrome.tabGroups.update(group.id, { collapsed: false })
              }
              return null
          }
        }

        // For multi-tab groups or when preserveSingleTabGroups is 'off'
        const shouldBeCollapsed = group.id !== activeTabInWindow?.groupId

        // Only update if the collapse state needs to change
        if (group.collapsed !== shouldBeCollapsed) {
          return chrome.tabGroups.update(group.id, { collapsed: shouldBeCollapsed })
        }

        return null
      })

      // Execute all non-null updates
      await Promise.all(updatePromises.filter(Boolean))
    }
  } catch (error) {
    if (
      error ==
      'Error: Tabs cannot be edited right now (user may be dragging a tab).'
    ) {
      setTimeout(updateGroups, 50)
    } else {
      console.error(error)
    }
  }
}

// Create a debounced version of updateGroups
const debouncedUpdateGroups = debounce(updateGroups, 100)

// Listen for tab activation
chrome.tabs.onActivated.addListener(() => {
  debouncedUpdateGroups()
})

// Listen for tab group updates
chrome.tabGroups.onUpdated.addListener(() => {
  debouncedUpdateGroups()
})

// Listen for tab updates (URL changes, etc.)
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  // Only trigger on complete to avoid multiple updates during loading
  if (changeInfo.status === 'complete') {
    debouncedUpdateGroups()
  }
})

// Reload the runtime on update to avoid sticking to outdated behavior in existing tabs
chrome.runtime.onUpdateAvailable.addListener(() => {
  chrome.runtime.reload()
})

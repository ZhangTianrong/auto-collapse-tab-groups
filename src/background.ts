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

      // Get all groups in this window
      const windowGroups = await chrome.tabGroups.query({
        windowId: window.id
      })

      // Update all groups: collapse if not containing active tab, expand if containing active tab
      const updatePromises = windowGroups.map(group =>
        chrome.tabGroups.update(group.id, {
          collapsed: group.id !== activeTabInWindow?.groupId
        })
      )

      await Promise.all(updatePromises)
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

// Save options to chrome.storage
function saveOptions() {
  const ignoreUngroupedTabs = document.getElementById(
    'ignoreUngroupedTabs'
  ).checked
  const preserveSingleTabGroups = document.getElementById(
    'preserveSingleTabGroups'
  ).value

  chrome.storage.sync.set(
    {
      ignoreUngroupedTabs,
      preserveSingleTabGroups
    },
    () => {
      // Notify background script that options have changed
      chrome.runtime.sendMessage({ type: 'optionsUpdated' })
    }
  )
}

// Restore options from chrome.storage
function restoreOptions() {
  chrome.storage.sync.get(
    {
      // Default values
      ignoreUngroupedTabs: true,
      preserveSingleTabGroups: 'keep-current'
    },
    items => {
      document.getElementById('ignoreUngroupedTabs').checked =
        items.ignoreUngroupedTabs
      document.getElementById('preserveSingleTabGroups').value =
        items.preserveSingleTabGroups
    }
  )
}

// Add event listeners
document.addEventListener('DOMContentLoaded', restoreOptions)
document
  .getElementById('ignoreUngroupedTabs')
  .addEventListener('change', saveOptions)
document
  .getElementById('preserveSingleTabGroups')
  .addEventListener('change', saveOptions)

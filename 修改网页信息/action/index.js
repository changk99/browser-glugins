const syncStorage = chrome.storage.sync
const clearEle = document.getElementById("clear")
const notificationEle = document.getElementById("notification")
const setupEle = document.getElementById("setup")
const urlEle = document.getElementById("url")
const notificationCloseBtn = notificationEle.querySelector(".notification__closeBtn")
const contentEle = notificationEle.querySelector("#content")

let notificationTimer = null
const notificationTimeout = 1500

/**
 * 通知
 * @param {string} message
 */
function notify(message) {
  contentEle.textContent = message
  const classList = notificationEle.classList
  if (!classList.contains("hidden")) {
    classList.add("hidden")
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      classList.remove("hidden")
      classList.add("slide-from")
      requestAnimationFrame(() => {
        if (notificationTimer) {
          clearTimeout(notificationTimer)
          notificationTimer = null
        }
        classList.remove("slide-from")
        notificationTimer = setTimeout(() => {
          classList.add("hidden")
        }, notificationTimeout)
      })
    })
  })
}

// 关闭弹框
notificationCloseBtn.addEventListener("click", () => {
  if (notificationTimer) {
    clearTimeout(notificationTimer)
    notificationTimer = null
  }
  notificationEle.classList.add("hidden")
})

/**
 * 向 content 脚本发送信号
 * @param {string} message
 */
function sendMessage(message) {
  chrome.tabs.query(
    {
      active: true,
      lastFocusedWindow: true,
    },
    function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, message)
    }
  )
}

// 启动和禁止
setupEle.addEventListener("click", (e) => {
  const inputEle = setupEle.querySelector(".checkbox__input")
  inputEle.classList.toggle("is-checked")
  if (inputEle.classList.contains("is-checked")) {
    syncStorage.set(
      {
        disabled: false,
      },
      () => {
        notify("已启用")
        sendMessage(SINGAL.SETUP)
      }
    )
  } else {
    syncStorage.set(
      {
        disabled: true,
      },
      () => {
        notify("已禁用")
        sendMessage(SINGAL.TEARDOWN)
      }
    )
  }
  // 阻止因为 label 和 input 之间的联动而导致的多次点击
  e.preventDefault()
})

// 更新拦截的 url
urlEle.addEventListener("change", (e) => {
  /**
   * @type { string }
   */
  let url = e.target.value
  url = url.trim()
  syncStorage.set(
    {
      url,
    },
    () => {
      notify("成功更新拦截的 url")
      sendMessage(SINGAL.RESTART)
    }
  )
})

// 清理缓存
function clearCacheSuccess() {
  notify("成功清理缓存")
}
clearEle.addEventListener("click", () => {
  syncStorage.remove("content", clearCacheSuccess)
})

// 初始化,因为每一个次打开 popup 页面都会重新执行,初始化可以保证状态一致
function init() {
  const inputEle = setupEle.querySelector(".checkbox__input")
  syncStorage
    .get({
      url: "",
      disabled: false,
    })
    .then(({ url, disabled }) => {
      inputEle.classList.toggle("is-checked", !disabled)
      urlEle.value = url
    })
}
init()

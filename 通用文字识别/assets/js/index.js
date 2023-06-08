/**
 * 创建关闭按钮
 */
function createCloseButton() {
  const notificationCloseBtn = document.createElement('i')
  notificationCloseBtn.innerHTML = `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="currentColor"
            d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"
          ></path></svg>`
  return notificationCloseBtn
}

/**
 * 创建普通按钮
 * @param {string} content
 */
function createButton(content) {
  const buttonEle = document.createElement('div')
  buttonEle.classList.add('cl-btn')
  buttonEle.textContent = content
  return buttonEle
}

let notificationTimer = null
/**
 * 滑动通知
 * @param {string} message
 * @param {number} notificationTimeout
 * @param {HTMLElement} container
 */
function notify(message, notificationTimeout = 1500, container = document.body, isFullScreen = false) {
  let notificationCloseBtn = null
  let contentEle = null
  let notificationEle = document.getElementById('cl-notification')

  if (!notificationEle) {
    notificationCloseBtn = createCloseButton()
    notificationCloseBtn.classList.add('cl-notification__closeBtn')
    notificationCloseBtn.id = "cl-notification-close-btn"

    contentEle = document.createElement('div')
    contentEle.classList.add('cl-content')
    contentEle.id = "cl-notification-content"

    notificationEle = document.createElement('div')
    notificationEle.classList.add('cl-notification')
    notificationEle.id = "cl-notification"

    notificationEle.appendChild(contentEle)
    notificationEle.appendChild(notificationCloseBtn)

    container.appendChild(notificationEle)
  } else {
    notificationCloseBtn = document.getElementById('cl-notification-close-btn')
    contentEle = document.getElementById('cl-notification-content')
  }
  
  contentEle.textContent = message

  if (isFullScreen) {
    notificationEle.style.position = "fixed"
  } else {
    notificationEle.style.position = "absolute"
  }

  const classList = notificationEle.classList

  if (!classList.contains("hidden")) {
    classList.add("hidden")
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      classList.remove("hidden")
      classList.add("cl-slide-from")
      requestAnimationFrame(() => {
        if (notificationTimer) {
          clearTimeout(notificationTimer)
          notificationTimer = null
        }
        classList.remove("cl-slide-from")
        notificationTimer = setTimeout(() => {
          classList.add("hidden")
        }, notificationTimeout)
      })
    })
  })

  // 关闭弹框
  notificationCloseBtn.addEventListener("click", () => {
    if (notificationTimer) {
      clearTimeout(notificationTimer)
      notificationTimer = null
    }
    notificationEle.classList.add("hidden")
  })
}

/**
 * 通知
 * @param {string} message
 * @param {'primary' | 'error' } type
 * @param {HTMLElement} container
 */
function message(message, type = "primary", container = document.body, isFullScreen = true) {
  let contentEle = document.getElementById('cl-message-content')
  let messageEle = document.getElementById('cl-message')

  if (!messageEle) {
    messageCloseBtn = createCloseButton()
    messageCloseBtn.classList.add('cl-message__closeBtn')
    messageCloseBtn.id = "cl-message-close-btn"
    // 关闭弹框
    messageCloseBtn.addEventListener("click", () => {
      messageEle.classList.add("hidden")
    })

    contentEle = document.createElement('div')
    contentEle.classList.add('cl-content')
    contentEle.id = "cl-message-content"
    if (type === 'error') {
      contentEle.style.color = "#f56c6c"
    }

    messageEle = document.createElement('div')
    messageEle.classList.add('cl-message')
    messageEle.id = "cl-message"

    messageEle.appendChild(contentEle)
    messageEle.appendChild(messageCloseBtn)

    container.appendChild(messageEle)
  } else {
    messageEle.classList.remove("hidden")
  }
  
  contentEle.textContent = message

  if (isFullScreen) {
    messageEle.style.position = "fixed"
  } else {
    messageEle.style.position = "absolute"
  }
}

/**
 * loading 提示
 * @param {string} message 
 * @param {HTMLElement} container 
 */
function loading(message, container = document.body, isFullScreen = true) {
  
  const spinner = document.createElement('div')
  spinner.classList.add('cl-spinner')
  if (isFullScreen) {
    spinner.style.position = "fixed"
  } else {
    spinner.style.position = "absolute"
  }

  contentEle = document.createElement('div')
  contentEle.classList.add('cl-content')
  contentEle.textContent = message

  spinner.innerHTML = `<svg class="cl-circular" viewBox="0 0 50 50"><circle class="cl-path" cx="25" cy="25" r="20" fill="none"></circle></svg>`
  container.appendChild(spinner)

  spinner.appendChild(contentEle)

  function close() {
    container.removeChild(spinner)
  }

  return close
}




let isCutOuting = false
let activeRecognizeGeneral = null
let activeDataUrl = ""

/**
 * 发送截图信息到 background.js
 * @param { {rect: {x: number, y: number, w: number, h: number}}} info
 */
function sendMessage(info) {
  console.log(`发送信息到 background`, info)
  chrome.runtime.sendMessage(info)
}
/**
 *
 * @param {string} dataUrl
 * @param {{x: number, y: number, w: number, h: number}} rect
 * @return {Promise<string>}
 */
function getRectDataUrl(dataUrl, rect) {
  return new Promise((resolve) => {
    /**
     * @type {HTMLCanvasElement}
     */
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = document.createElement("img")
    img.onload = function () {
      const { x, y, w, h } = rect
      canvas.width = w
      canvas.height = h
      ctx.drawImage(img, x, y, w, h, 0, 0, w, h)
      resolve(canvas.toDataURL())
    }
    img.src = dataUrl
  })
}

/**
 * 接收 background.js 发送过来的信息
 */
chrome.runtime.onMessage.addListener(async ({ imageDataUrl, rect }) => {
  if (imageDataUrl) {
    console.log("获取到屏幕截图")
    const rectDataUrl = await getRectDataUrl(imageDataUrl, rect)
    console.log("获取到矩形选择框内的内容")
    const dataLoaded = new CustomEvent("dataloaded", {
      detail: rectDataUrl,
    })
    document.dispatchEvent(dataLoaded)
  }
})

/**
 * 获取发送通用文本识别接口请求的实例对象
 */
async function getRecognizeGeneral() {
  const { activePlatform, settings } = await syncStorage.get({
    activePlatform: "baidu",
    settings: {},
  })
  if (!settings[activePlatform]) {
    message(`需要设置[${PLATFORMS[activePlatform].name}]的配置`)
    return null
  }
  const platformSetting = settings[activePlatform]
  for (const setting of PLATFORMS[activePlatform].settings) {
    if (!platformSetting[setting]) {
      message(`需要设置[${PLATFORMS[activePlatform].name}]的[${setting}]配置`)
      return null
    }
  }
  const recognizeGeneral =
    PLATFORMS[activePlatform].getRecognizeGeneral(platformSetting)
  // 用于重试
  activeRecognizeGeneral = recognizeGeneral

  if (!recognizeGeneral) {
    message(`[${PLATFORMS[activePlatform].name}]暂不支持`)
  }
  return recognizeGeneral
}

/**
 * 获取识别脚本
 * @param {string} dataUrl
 */
async function getRecognizeGeneralContent(dataUrl) {
  const recognizeGeneral = await getRecognizeGeneral()
  if (recognizeGeneral) {
    console.log("获取到通用识别文本实例")
    const closeLoading = loading("等待识别...")
    createContentView()
    try {
      const content = await recognizeGeneral.getContent(dataUrl)
      const contentViewContentEle = document.getElementById(
        "cl-content-view-content"
      )
      contentViewContentEle.value = content
    } catch (error) {
      console.log(error)
      message(error.message || error, "error")
    }
    closeLoading()
  }
}

/**
 * @param {CustomEvent} event
 */
function handlerdataloaded(event) {
  activeDataUrl = event.detail
  getRecognizeGeneralContent(event.detail)
}

// 监听截图数据完成事件
document.addEventListener("dataloaded", handlerdataloaded)

/**
 * @param {CustomEvent} event
 */
function handlerCutOutDone(event) {
  sendMessage({
    type: 'getImageDataUrl',
    data: event.detail
  })
}

// 监听截图操作的完成
document.addEventListener("cutoutdone", handlerCutOutDone)

/**
 * 判断当前页面是否可以截取
 * @return {Promise<boolean>}
 */
async function canEditable() {
  const { disabled } = await syncStorage.get({
    disabled: false,
  })
  if (disabled) {
    return false
  }
  return true
}

/**
 * 开启截图操作
 * @param {KeyboardEvent} event
 *
 */
function cutOut(event) {
  if (event.ctrlKey && event.altKey && !isCutOuting) {
    isCutOuting = true
    const mask = document.createElement("div")
    // layer 防止击穿
    const layer = document.createElement("div")
    mask.style.cssText =
      "position: fixed; top: 0; left: 0;width: 0; height: 0; outline: rgba(0,0,0,0.8) solid 9999px; z-index: 10000 "
    layer.style.cssText =
      "position: fixed; top: 0; left: 0;width: 100vw; height: 100vh; z-index: 9999"
    document.body.appendChild(mask)
    document.body.appendChild(layer)

    let x = 0
    let y = 0
    let w = 0
    let h = 0
    let startX = 0
    let startY = 0

    /**
     * 绘制矩形
     * @param {MouseEvent} event
     */
    function setRect(event) {
      w = event.clientX - startX
      h = event.clientY - startY
      if (w < 0) {
        w = -w
        x = startX - w
        mask.style.left = x + "px"
      }
      if (h < 0) {
        h = -h
        y = startY - h
        mask.style.top = y + "px"
      }
      mask.style.width = w + "px"
      mask.style.height = h + "px"
    }

    /**
     * 开始绘制矩形
     * @param {MouseEvent} event
     */
    function startDraw(event) {
      x = startX = event.clientX
      y = startY = event.clientY
      mask.style.left = startX + "px"
      mask.style.top = startY + "px"
      mask.style.width = 0
      mask.style.height = 0
      document.addEventListener("mousemove", setRect)
      document.addEventListener(
        "mouseup",
        () => {
          document.removeEventListener("mousemove", setRect)
        },
        {
          once: true,
        }
      )
    }

    document.addEventListener("mousedown", startDraw)

    function clear() {
      isCutOuting = false
      document.body.removeChild(mask)
      document.body.removeChild(layer)
      console.log(event, event.type)
      document.removeEventListener("mousedown", startDraw)
      const cutOutDone = new CustomEvent("cutoutdone", {
        detail: {
          rect: {
            x,
            y,
            w,
            h,
          },
        },
      })
      document.dispatchEvent(cutOutDone)
    }
    document.addEventListener("keyup", clear, {
      once: true,
    })
  }
}

// 开启截取功能
function setup() {
  // 监听元素修改,并存储修改后的信息
  document.addEventListener("keydown", cutOut)

  console.log("成功开启")
}

// 关闭截取功能
function teardown() {
  document.removeEventListener("keydown", cutOut)
  console.log("成功关闭")
}

/**
 * 打开文本窗口
 */
function openContentView() {
  const contentViewEle = document.getElementById("cl-content-view")
  if (contentViewEle) {
    contentViewEle.classList.remove("hidden")
  } else {
    createContentView()
  }
}

// 监听 popup 页面发送过来的信号
chrome.runtime.onMessage.addListener(async function (request) {
  switch (request) {
    case SINGAL.SETUP:
      setup()
      break
    case SINGAL.TEARDOWN:
      teardown()
      break
    case SINGAL.OPENCONTENTVIEW:
      openContentView()
      break
    default:
      break
  }
})

/**
 *
 * @param {string} content
 */
async function setClipboard(content) {
  if (navigator && 'clipboard' in navigator) {
    const type = "text/plain"
    const blob = new Blob([content], { type })
    const data = [new ClipboardItem({ [type]: blob })]
    await navigator.clipboard.write(data)
  } else {
    const textareaEle = document.createElement('textarea')
    textareaEle.value = content || ''
    textareaEle.style.position = 'absolute'
    textareaEle.style.opacity = '0'
    document.body.appendChild(textareaEle)
    textareaEle.select()
    document.execCommand('copy')
    textareaEle.remove()
  }
}

/**
 *
 * @param {HTMLTextAreaElement} target
 */
async function copy(target) {
  let start = target.selectionStart
  let end = target.selectionEnd
  if (start === end) {
    target.select()
  }
  let selectText = window.getSelection().toString()
  target.selectionStart = start
  target.selectionEnd = end
  if (start !== end) {
    target.focus()
  }
  await setClipboard(selectText)
}

/**
 * 创建文本显示窗体
 * @param {{container: HTMLElement}} param0
 */
function createContentView({ container = document.body } = {}) {
  let contentViewEle = document.getElementById("cl-content-view")

  if (contentViewEle) {
    contentViewEle.classList.remove("hidden")
    return
  }
  contentViewCloseBtn = createCloseButton()
  contentViewCloseBtn.classList.add("cl-content-view__closeBtn")
  contentViewCloseBtn.id = "cl-content-view-close-btn"
  contentViewCloseBtn.addEventListener("click", () => {
    contentViewEle.classList.add("hidden")
  })

  contentViewContentEle = document.createElement("textarea")
  contentViewContentEle.classList.add("cl-content-view-content")
  contentViewContentEle.id = "cl-content-view-content"

  contentViewEle = document.createElement("div")
  contentViewEle.classList.add("cl-content-view")
  contentViewEle.id = "cl-content-view"

  contentViewRertyEle = createButton("重试")
  contentViewRertyEle.classList.add("cl-content-view-retry")
  contentViewRertyEle.addEventListener("click", async () => {
    if (activeRecognizeGeneral && activeDataUrl) {
      const closeLoading = loading("等待识别...")
      try {
        const content = await activeRecognizeGeneral.getContent(activeDataUrl)
        const contentViewContentEle = document.getElementById(
          "cl-content-view-content"
        )
        contentViewContentEle.value = content
      } catch (error) {
        console.log(error)
        message(error.message || error, "error")
      }
      closeLoading()
    } else {
      message("请先进行截图操作")
    }
  })

  contentViewCopyEle = createButton("复制")
  contentViewCopyEle.classList.add("cl-content-view-copy")
  contentViewCopyEle.addEventListener("click", async () => {
    try {
      await copy(contentViewContentEle)
      notify("复制成功", 1500, contentViewEle)
    } catch (error) {
      message(error.message, "error")
    }
  })

  contentViewCopeAndCloseEle = createButton("复制并关闭")
  contentViewCopeAndCloseEle.classList.add("cl-content-view-copy-and-close")
  contentViewCopeAndCloseEle.addEventListener("click", async () => {
    try {
      await copy(contentViewContentEle)
      notify("复制成功", 1500, contentViewEle)
      contentViewEle.classList.add("hidden")
    } catch (error) {
      message(error.message, "error")
    }
  })

  contentViewEle.appendChild(contentViewContentEle)
  contentViewEle.appendChild(contentViewCloseBtn)
  contentViewEle.appendChild(contentViewRertyEle)
  contentViewEle.appendChild(contentViewCopyEle)
  contentViewEle.appendChild(contentViewCopeAndCloseEle)

  container.appendChild(contentViewEle)
}

/**
 * 初始化
 */
async function init() {
  console.log("初始化")
  const isEditable = await canEditable()
  if (!isEditable) {
    return
  }
  setup()
}

init()

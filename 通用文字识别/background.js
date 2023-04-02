const TIMEOUTINFO = "请求超时"
/**
 * 接收 content.js 传来的信息
 */
chrome.runtime.onMessage.addListener(async ({ type, data, requestID }) => {
  switch (type) {
    case "getImageDataUrl":
      getImageDataUrl(data)
      break
    case "fetch":
      const info = {
        type: 'fetch',
        data: {
          errCode: 0,
          errMessage: "",
          result: null
        },
        requestID: requestID
      }
      try {
        info.data.result = await fetchWithTimeout(data.input, data.options, data.timeout)
      } catch (error) {
        info.data.errCode = 1
        info.data.errMessage = error.message || error
      }
      sendMessage(info)
    default:
      break
  }
})

/**
 *
 * @param {{rect: {x: number, y: number, w: number, h: number}}} data
 */
async function getImageDataUrl(data) {
  const rect = data.rect
  if (rect.w > 0 && rect.h > 0) {
    chrome.tabs.query(
      {
        active: true,
        lastFocusedWindow: true,
      },
      async function (tabs) {
        const imageDataUrl = await chrome.tabs.captureVisibleTab()
        chrome.tabs.sendMessage(tabs[0].id, {
          imageDataUrl,
          rect,
        })
      }
    )
  }
}

/**
 * @param {string} input
 * @param {object} options
 * @param {number} timeout
 * @retrun {Promise<Record<string, any>>}
 */
function fetchWithTimeout(input, options, timeout = 3000) {
  let timer = null
  const timePromise = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error(TIMEOUTINFO))
    }, timeout)
  })
  const fetchPromse = fetch(input, options).then((response) => {
    console.log(response)
    if (response.ok) {
      return response.json()
    }
    throw new Error(`[${response.status}]: ${response.statusText}`)
  }).finally(() => {
    clearTimeout(timer)
  })
  return Promise.race([timePromise, fetchPromse])
}

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

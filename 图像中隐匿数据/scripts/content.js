const syncStorage = chrome.storage.sync

/**
 * 判断当前插件是否被禁用
 * @return {Promise<boolean>}
 */
async function canRun() {
  const { disabled } = await syncStorage.get({
    disabled: false,
  })
  if (disabled) {
    return false
  }
  return true
}


// 开启截取功能
function setup() {
  console.log("成功开启")
}

// 关闭截取功能
function teardown() {
  console.log("成功关闭")
}

// 监听 popup 页面发送过来的信号
contentToPopupPort.onMessage(async function ({type, data}) {
  console.log(type, data)
  switch (type) {
    case SINGAL.SETUP:
      setup()
      break
    case SINGAL.TEARDOWN:
      teardown()
      break
    default:
      break
  }
})


/**
 * 初始化
 */
async function init() {
  console.log("初始化")
  const isEditable = await canRun()
  if (!isEditable) {
    return
  }
  setup()
}
init()

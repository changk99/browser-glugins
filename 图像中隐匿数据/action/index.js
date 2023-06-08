const syncStorage = chrome.storage.sync
const setupEle = document.getElementById("cl-setup")
const inputEle = setupEle.querySelector(".cl-checkbox__input")

// 启动和禁止
setupEle.addEventListener("click", async (e) => {
  inputEle.classList.toggle("cl-is-checked")
  // 阻止因为 label 和 input 之间的联动而导致的多次点击
  e.preventDefault()
  if (inputEle.classList.contains("cl-is-checked")) {
    await syncStorage.set({
      disabled: false,
    })
    CLSurface.notify("已启用")
    sendMessage({
      type: SINGAL.SETUP,
    })
  } else {
    await syncStorage.set({
      disabled: true,
    })
    CLSurface.notify("已禁用")
    sendMessage({
      type: SINGAL.TEARDOWN,
    })
  }
  
})

// 初始化,因为每一个次打开 popup 页面都会重新执行,初始化可以保证状态一致
async function init() {
  const { disabled } = await syncStorage.get({
    disabled: false,
  })
  inputEle.classList.toggle("cl-is-checked", !disabled)
}

init()

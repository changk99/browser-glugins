const syncStorage = chrome.storage.sync
const setupEle = document.getElementById("setup")
const inputEle = setupEle.querySelector(".checkbox__input")
const platformsEle = document.getElementById("platforms")
const platformSettingEle = document.getElementById("platform-setting")
const openContentViewButtonEle = document.getElementById("open-content-view-button")
const clearKeyEle = document.getElementById("clear-key")

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

// 切换设置的显示和隐藏
platformsEle.addEventListener('click', (event) => {
  const target = event.target
  const platform = target.dataset.platform
  if (platform) {
    const activeEle = platformsEle.querySelector('.active')
    activeEle.classList.remove('active')
    target.classList.add('active')
    syncStorage.set({
      activePlatform: platform
    }, () => {
      const activeSettingEle = platformSettingEle.querySelector('.active')
      activeSettingEle.classList.remove('active')
      const newActiveSettingEle = platformSettingEle.querySelector(`[data-platform="${platform}"]`)
      newActiveSettingEle.classList.add('active')
    })
  }
})

// 监听设置的改变
platformSettingEle.addEventListener('change', async (event) => {
  const target = event.target
  const settingName = target.dataset.setting
  const settingPlatform = target.closest('[data-platform]').dataset.platform
  const {settings} = await syncStorage.get({
    settings: {}
  })
  if (!settings[settingPlatform]) {
    settings[settingPlatform] = {}
  }
  console.log(settings)
  settings[settingPlatform][settingName] = target.value
  await syncStorage.set({
    settings
  })
  notify(`更新[${PLATFORMS[settingPlatform].name}]的[${settingName}]配置`)
})

/**
 * 创建平台的标签栏
 * @param {string} platform
 * @param {{name: string, settings: string[]}} platformConfig 
 */
function createTabEle(platform, platformConfig) {
  const div = document.createElement('div')
  platformsEle.appendChild(div)
  div.outerHTML = `<div data-platform="${platform}" class="platform">${platformConfig.name}</div>`
}

/**
 * 创建平台的标签栏
 * @param {string} platform
 * @param {{name: string, settings: string[]}} platformConfig 
 */
function createPlatformSettingEle(platform, platformConfig, settings) {
  const div = document.createElement('div')
  platformSettingEle.appendChild(div)
  div.setAttribute('data-platform', platform)
  div.setAttribute('class', 'form-item')
  div.innerHTML = platformConfig.settings.map((settingName) => {
    return `<div><label class="label" for="url">${settingName}: </label>
    <input
      data-setting="${settingName}"
      placeholder="请填写 ${settingName}"
      class="input"
      type="text"
      id="url"
      value="${(settings[platform] && settings[platform][settingName]) || ""}"
    /></div>`
  }).join("")
}

/**
 * 打开文本窗口
 */
openContentViewButtonEle.addEventListener('click', () => {
  sendMessage(SINGAL.OPENCONTENTVIEW)
})

/**
 * 清除密钥信息
 */
clearKeyEle.addEventListener('click', async () => {
  const { activePlatform, settings } = await syncStorage.get({
    activePlatform: 'baidu',
    settings: {}
  })
  await syncStorage.set({
    settings: {
      ...settings,
      [activePlatform]: {}
    }
  })
  const activePlatformSettingEle = platformSettingEle.querySelector(`[data-platform="${activePlatform}"]`)
  const inputs = activePlatformSettingEle.querySelectorAll(`[data-setting]`)
  inputs.forEach((input) => {
    input.value = ""
  })
  notify(`清除了[${PLATFORMS[activePlatform].name}]的配置`)
})

// 初始化,因为每一个次打开 popup 页面都会重新执行,初始化可以保证状态一致
function init() {
  syncStorage
    .get({
      disabled: false,
      activePlatform: 'baidu',
      settings: {}
    })
    .then(({ activePlatform, disabled, settings }) => {
      inputEle.classList.toggle("is-checked", !disabled)
      
      Object.keys(PLATFORMS).forEach((platform) => {
        // 初始化平台标签
        createTabEle(platform, PLATFORMS[platform])

        // 初始化平台标签设置
        createPlatformSettingEle(platform, PLATFORMS[platform], settings)
      })
      platformsEle.querySelector(`[data-platform=${activePlatform}]`).classList.add('active')
      platformSettingEle.querySelector(`[data-platform=${activePlatform}]`).classList.add('active')
    })
}

init()

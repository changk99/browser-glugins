const TIMEOUTINFO = "请求超时"
const syncStorage = chrome.storage.sync

class BaiDuOCRRecognizeGeneral {
  static tokenUrl = "https://aip.baidubce.com/oauth/2.0/token"
  static accurateBasicUrl = "https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic"
  constructor(settings) {
    this.api_key = settings.api_key
    this.secret_key = settings.secret_key
  }
  async getContent(dataUrl) {
    const access_token = await this._getAccessToken()
    const url = BaiDuOCRRecognizeGeneral.accurateBasicUrl + `?access_token=${access_token}`
    const options = {
      method: 'POST',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        image: dataUrl
      }).toString()
    }
    let result = null
    try {
      result = await fetchWithTimeout(url, options)
      if (result.error_code > 0) {
        throw new Error(`[${result.error_code}]: ${result.error_msg}`)
      }
    } catch (error) {
      throw error
    }
    return this._formatContent(result)
  }
  async _getAccessToken() {
    const key = this._createAccessTokenKey()
    const { cache } = await syncStorage.get({
      cache: {}
    })
    if (cache[key]) {
      const {access_token, expires_date} = cache[key]
      // 提前一天更新 access_token
      if (Date.now() < (expires_date - 24 * 60 * 60 * 1000)) {
        console.log(`从缓存中获取百度的 access_token`)
        return access_token
      }
    }

    const url =
      BaiDuOCRRecognizeGeneral.tokenUrl +
      `?grant_type=client_credentials&client_id=${this.api_key}&client_secret=${this.secret_key}`
    const options = {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      }
    }
    let result = null
    try {
      result = await fetchWithTimeout(url, options)
    } catch (error) {
      if (error.message === TIMEOUTINFO) {
        throw new Error(`获取 access_token 超时`)
      }
      throw new Error(`获取 access_token 失败,请检查 api_key 或者 api_secret`)
    }
    // 记录 access_token 过期时间
    result.expires_date = Date.now() + 2592000 * 1000 
    await syncStorage.set({
      cache: {
        [key]: result
      }
    })
    console.log(`成功获取百度的 access_token 并进行保存`)
    return result.access_token
  }

  _createAccessTokenKey() {
    return CryptoJS.MD5(`baidu_${this.api_key}_${this.secret_key}`)
  }

  _formatContent(result) {
    const { words_result } = result
    return words_result.map((words_result) => {
      return words_result.words
    }).join('\n')
  }
}


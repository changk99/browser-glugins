const SINGAL = {
  TEARDOWN: 'TEARDOWN',
  SETUP: 'SETUP',
  RESTART: 'RESTART',
  OPENCONTENTVIEW: 'OPENCONTENTVIEW'
}

const PLATFORMS = {
  'baidu': {
    name: '百度',
    settings: ['api_key', 'secret_key'],
    getRecognizeGeneral(platformSetting) {
      return new BaiDuOCRRecognizeGeneral(platformSetting)
    }
  },
  'huawei': {
    name: '华为',
    settings: ['access-id', 'access-secret'],
    getRecognizeGeneral() {
    }
  },
  'tencent': {
    name: '腾讯',
    settings: ['access_token'],
    getRecognizeGeneral() {
    }
  }
}

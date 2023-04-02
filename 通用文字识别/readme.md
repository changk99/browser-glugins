>### 使用

    需要注册相应平台的账号,并把获取的 key 等信息填入到配置中,可以查看【相关链接】获取到对应平台的注册入口。

    启动后,聚焦窗口,然后按住 ctrl + alt 键然后点击鼠标并拖动鼠标来框选要识别的区域

>### 功能

    通过人工智能平台,对浏览器区域内的图像数据进行通用的文本字体识别

>### 配置

    点击扩展图标,可以对扩展进行配置

    启动切换: 禁止后,将不能进行框选操作

    key 设置: 设置对应平台的 key 信息,点击不同的平台,会让该平台处于活跃状态,并使用对应的 api 发起请求。

    打开文本窗口: 将打开文本窗口
      * 重试: 对之前框选的图像数据再次发送请求

      * 复制: 复制文本框中的内容,如果没有选中任何内容,那么将复制全部的内容

      * 复制并关闭: 复制后关闭文本框

    清除 key 信息: 清除对应平台的 key 信息

>### 限制

    该扩展使用的是 v3 协议,要求 chrome 的内核版本是 88 及以上。因为大部分浏览器都使用了 chrome 内核,因此可支持大部分浏览器。可以按 F12 打开浏览器控制台,输入 navigator.userAgent,假如输出是 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36',那么这个是 102 版本的,可以支持

>### 相关链接

    https://console.bce.baidu.com/ai/#/ai/ocr/overview/index
    百度智能云服务概览

    https://console.bce.baidu.com/ai/#/ai/ocr/overview/resource/getFree
    百度智能云领取免费资源

    https://console.bce.baidu.com/ai/#/ai/ocr/app/list
    百度智能云查看 API Key 和 Secret Key
const syncStorage = chrome.storage.sync;
const url = document.location.href;
/**
 * @type {MutationObserver | null}
 */
let activeObserver = null;
let setTextTimer = null;
let setTextInterval = 80;

/**
 * 获取 dom 元素对应的 XPath
 * 使用 XPath 定位修改的节点
 * @param { HTMLElement } element
 * @return { string }
 */
function getXPath(element) {
  if (element === document.documentElement) {
    return "/html";
  }
  if (element === document.body) {
    return "/html/body";
  }
  if (!element.parentNode) {
    return "/" + element.tagName.toLowerCase();
  }
  let index = 0;
  let nodes = element.parentNode.children;
  for (const node of nodes) {
    if (node === element) {
      return (
        getXPath(node.parentNode) +
        "/" +
        element.tagName.toLowerCase() +
        `[${index + 1}]`
      );
    }
    if (node.tagName === element.tagName) {
      index++;
    }
  }
}

/**
 * 通配符匹配
 * @param {string} string
 * @param {string} pattern
 * @return {boolean}
 */
const isMatch = function (string, pattern) {
  let s = 0,
    p = 0;
  let starIdx = -1,
    pointer = -1;

  while (s < string.length) {
    if (
      (p < pattern.length && string[s] === pattern[p]) ||
      pattern[p] === "?"
    ) {
      s++;
      p++;
    } else if (p < pattern.length && pattern[p] === "*") {
      starIdx = p;
      pointer = s;
      p++;
    } else if (starIdx === -1) return false;
    else {
      p = starIdx + 1;
      s = pointer + 1;
      pointer = s;
    }
  }
  for (let idx = p; idx < pattern.length; idx++) {
    if (pattern[idx] !== "*") return false;
  }
  return true;
};

/**
 * 判断当前页面是否可以编辑
 * @return {Promise<boolean>}
 */
async function canEditable() {
  const href = location.href;
  const { disabled, url } = await syncStorage.get({
    disabled: false,
    url: "",
  });
  if (disabled) {
    return false;
  }
  if (url === "") {
    return true;
  }
  try {
    console.log(url);
    let regExpResult = new RegExp(url).test(href);
    if (regExpResult) {
      return true;
    }
    return isMatch(href, url);
  } catch (error) {
    return isMatch(href, url);
  }
}

/**
 * 存储修改后的信息
 * @param {InputEvent } e
 */
function saveEditedInfo(e) {
  /**
   * @type { HTMLElement }
   */
  const target = e.target;
  const text = target.textContent;
  const path = getXPath(target);
  syncStorage.get(
    {
      content: {},
    },
    ({ content }) => {
      if (!content[url]) {
        content[url] = {};
      }
      content[url][path] = text;
      syncStorage.set(
        {
          content,
        },
        () => {
          console.log(`成功设置最新的信息`, content);
        }
      );
    }
  );
}

/**
 * 设置需要处理的元素
 * @param {Element} target
 * @return {boolean}
 */
function needObserve(target) {
  if (target.nodeType === 1) {
    const tagName = target.tagName.toLowerCase();
    return ![
      "html",
      "body",
      "head",
      "meta",
      "script",
      "style",
      "title",
    ].includes(tagName);
  }
  return false;
}

/**
 * 使用存储的数据填充节点
 * @param {HTMLElement} target
 * @param {Record<string, any>} saveContent
 * @param {boolean} isEditable
 */
function setText(target, saveContent, isEditable) {
  if (!isEditable) {
    return;
  }
  if (saveContent[url]) {
    const xPath = getXPath(target);
    if (Object.keys(saveContent[url]).includes(xPath)) {
      target.textContent = saveContent[url][xPath];
      // console.log('由监听进行替换')
    }
  }
}

/**
 * 启动元素渲染插入的监听
 * 元素插入时由存储的数据替换原来的数据
 */
function observe() {
  let saveContent = null;
  let isEditable = null;
  // 尽快读取只能异步获取的状态信息,尽量保证 MutationObserver 处理函数不是异步修改节点内容,不然会出现内容闪烁
  const awaitAll = Promise.all([
    syncStorage
      .get({
        content: {},
      })
      .then(({ content }) => {
        saveContent = content;
      }),
    canEditable().then((editable) => {
      isEditable = editable;
    }),
  ]);

  // 开启轮询
  awaitAll.then(() => {
    if (saveContent[url] && isEditable) {
      /**
       * @type {Set}
       */
      const xPathSet = new Set(Object.keys(saveContent[url]));
      setTextTimer = setInterval(() => {
        xPathSet.forEach((xPath) => {
          const target = document.evaluate(xPath, document).iterateNext();
          if (target) {
            target.textContent = saveContent[url][xPath];
            // console.log('由轮询进行替换')
            xPathSet.delete(xPath);
          }
          if (xPathSet.size === 0) {
            clearInterval(setTextTimer);
          }
        });
      }, setTextInterval);
    }
  });

  // 使用 MutationObserver 监听的方式有比较好的效果,不会出现节点闪烁
  // 但是并不一定可以拦截所有的节点,例如通过 innerHTML = "<span>12</span>",那么 span 节点将不会在第一次插入时触发监听回调
  // 因此需要配合轮询来保证数据可以被修改
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      const target = mutation.target;
      if (needObserve(target)) {
        if (saveContent === null || isEditable === null) {
          awaitAll.then(() => {
            setText(target, saveContent, isEditable);
          });
        } else {
          setText(target, saveContent, isEditable);
        }
      }
    });
  });
  observer.observe(document, {
    subtree: true,
    childList: true,
  });
  activeObserver = observer;
}

/**
 * 终止监听元素插入
 */
function stopObserve() {
  if (activeObserver) {
    activeObserver.disconnect();
  }
  if (setTextTimer) {
    clearInterval(setTextTimer);
  }
}

/**
 * 让元素可编辑
 * @param { MouseEvent } e
 */
function makeElementEditable(e) {
  if (!e.ctrlKey) {
    return;
  }

  // 在捕获阶段触发,并取消后续的函数监听,避免点击跳转
  e.stopImmediatePropagation();

  // 取消打开菜单的默认行为
  e.preventDefault();

  /**
   * @type { HTMLElement }
   */
  const target = e.target;

  // 如果点击的元素具有子元素,直接退出,不然会导致修改信息时删除子元素而改变了节点结构
  if (target.children.length > 0) {
    return;
  }

  target.contentEditable = true;
  target.focus();
}

// 开启拦截功能
function setup() {
  // 监听元素修改,并存储修改后的信息
  document.addEventListener("input", saveEditedInfo);

  // 右键单击元素后让元素处于可修改状态
  document.addEventListener("contextmenu", makeElementEditable, {
    capture: true,
  });
  console.log("成功开启");
}

// 关闭拦截功能
function teardown() {
  document.removeEventListener("input", saveEditedInfo);
  document.removeEventListener("contextmenu", makeElementEditable, {
    capture: true,
  });
  console.log("成功关闭");
}

async function init() {
  console.log("初始化");
  // 对节点的监听必须先开启,不然无法进行拦截
  observe();
  const isEditable = await canEditable();
  if (!isEditable) {
    // 提前终止监听,提升性能
    stopObserve();
    return;
  }
  setup();
}

// 监听 popup 页面发送过来的信号
chrome.runtime.onMessage.addListener(async function (request) {
  switch (request) {
    case SINGAL.SETUP:
      setup();
      break;
    case SINGAL.TEARDOWN:
      teardown();
    case SINGAL.RESTART:
      teardown();
      if (await canEditable()) {
        setup();
      }
    default:
      break;
  }
});

// SPA 页面在切换地址时也应该执行初始化
window.addEventListener("popstate", init);

init();

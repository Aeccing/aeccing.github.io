!(function () {
  let htmlEditor, cssEditor, jsEditor;
  const outputIframe = document.getElementById("output-iframe");
  const editorContainer = document.getElementById("editor-container");
  const outputhHeader = document.querySelector(".output-header");
  const clear = document.getElementById("clear");
  const cssEditorEl = document.getElementById("css-editor");
  const htmlEditorEl = document.getElementById("html-editor");
  const jsEditorEl = document.getElementById("js-editor");
  const tabContainer = document.getElementById("tab-container");
  const tabButton = tabContainer.querySelectorAll('button[role="tab"]');
  const tablist = document.getElementById("tablist");
  const run = document.getElementById("run");
  const basehtml = document.getElementById("basehtml");
  const isautorun = document.getElementById("isautorun");
  const download = document.getElementById("download");
  class Storage {
    constructor(options) {
      this.storeHandler = localStorage;
      this.getKeyHandler = (key) => `__${key}__`;
    }
    get(targetKey) {
      const key = this.getKeyHandler(targetKey);
      const orignalStore = this.storeHandler.getItem(key);
      const { value } = JSON.parse(orignalStore || "{}");
      return value;
    }
    set(targetKey, value) {
      const key = this.getKeyHandler(targetKey);
      this.storeHandler.setItem(key, JSON.stringify({ key, value }));
    }
    move(targetKey) {
      const key = this.getKeyHandler(targetKey);
      this.storeHandler.removeItem(key);
    }
  }
  const storage = new Storage();

  function g(e, t) {
    t && (t.setAttribute("aria-selected", !1), t.setAttribute("tabindex", -1)),
      e.setAttribute("aria-selected", !0),
      e.removeAttribute("tabindex"),
      e.focus();
  }
  function p(key) {
    const t = tablist.querySelector('button[aria-selected="true"]');
    ("forward" !== key && "reverse" !== key) ||
      ("forward" === key
        ? t.nextElementSibling
          ? (g(t.nextElementSibling, t), t.nextElementSibling.click())
          : (g(tabButton[0]), tabButton[0].click())
        : "reverse" === key &&
          (t.previousElementSibling
            ? (g(t.previousElementSibling, t), t.previousElementSibling.click())
            : (g(tabButton[tabButton.length - 1]),
              tabButton[tabButton.length - 1].click())));
  }
  function tablistAddEventListener() {
    tablist.addEventListener("click", (e) => {
      const target = e.target;
      if ("tab" === target.getAttribute("role")) {
        const selectedTab = tablist.querySelector(
          'button[aria-selected="true"]'
        );
        const selectedTabPanel = document.getElementById(
          target.getAttribute("aria-controls")
        );
        const allTabPanel = tabContainer.querySelectorAll('[role="tabpanel"]');
        for (const e of allTabPanel) e.classList.add("hidden");
        g(target, selectedTab);
        selectedTabPanel.classList.remove("hidden");
        selectedTabPanel.setAttribute("aria-hidden", false);
      }
    });
    tablist.addEventListener("keyup", (e) => {
      switch ((e.stopPropagation(), e.key)) {
        case "ArrowRight":
        case "ArrowDown":
          p("forward");
          break;
        case "ArrowLeft":
        case "ArrowUp":
          p("reverse");
          break;
        case "Home":
          g(tabButton[0]);
          break;
        case "End":
          g(tabButton[tabButton.length - 1]);
          break;
        case "default":
          return;
      }
    });
  }
  function generateSrcDoc() {
    const contentMap = {
      htmlContent: htmlEditor.getValue(),
      cssContent: cssEditor.getValue(),
      jsContent: jsEditor.getValue(),
    };
    storage.set("cssContent", contentMap.cssContent);
    storage.set("htmlContent", contentMap.htmlContent);
    storage.set("jsContent", contentMap.jsContent);
    var html = contentMap.htmlContent,
      css = contentMap.cssContent,
      js = contentMap.jsContent,
      src = html;
    if (html) {
      var patternHtmlTag = /<html([^>]*)>/im;
      var array_matches_html_tag = patternHtmlTag.exec(src);
      if (array_matches_html_tag) {
        src = src.replace("<html>", "<html " + array_matches_html_tag[1] + ">");
      }
      var patternHead = /<head[^>]*>((.|[\n\r])*)<\/head>/im;
      var array_matches_head = patternHead.exec(src);

      var patternBodyTag = /<body([^>]*)>/im;
      var array_matches_body_tag = patternBodyTag.exec(src);
      if (array_matches_body_tag) {
        src = src.replace("<body>", "<body " + array_matches_body_tag[1] + ">");
      }
    }
    // CSS
    if (css) {
      css = "\n<style>\n" + css + "\n</style>\n";
      if (array_matches_head) {
        src = src.replace("</head>", css + "</head>");
      } else if (array_matches_body_tag) {
        src = src.replace("</body>", css + "</body>");
      } else {
        src += css;
      }
    }

    // Javascript
    if (js) {
      js = "\n<script>\n" + js + "\n</script>\n";
      if (array_matches_body_tag) {
        src = src.replace("</body>", js + "</body>");
      } else {
        src += js;
      }
    }
    var text = src;
    return text;
  }
  function writeIframe() {
    const text = generateSrcDoc();
    const ifrw = outputIframe.contentWindow
      ? outputIframe.contentWindow
      : outputIframe.contentDocument.document
      ? outputIframe.contentDocument.document
      : outputIframe.contentDocument;
    ifrw.document.open();
    ifrw.document.write(text);
    ifrw.document.close();
  }
  function createEditor() {
    const theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "vs-dark"
      : "vs";
    [htmlEditor, cssEditor, jsEditor] = [
      { language: "html", el: htmlEditorEl, content: "htmlContent" },
      { language: "css", el: cssEditorEl, content: "cssContent" },
      { language: "javascript", el: jsEditorEl, content: "jsContent" },
    ].map(({ language, el, content }) => {
      return monaco.editor.create(el, {
        value: storage.get(content),
        language: language,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        contextmenu: false,
        minimap: { enabled: false },
        theme: theme,
      });
    });
    jsEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      formatDocument();
    });
  }

  function formatDocument() {
    htmlEditor.trigger("a", "editor.action.formatDocument");
    cssEditor.trigger("a", "editor.action.formatDocument");
    jsEditor.trigger("a", "editor.action.formatDocument");
    if (isautorun.checked) {
      writeIframe();
    }
  }

  run.addEventListener("click", writeIframe);
  basehtml.addEventListener("click", () => {
    htmlEditor.setValue(
      '<!DOCTYPE html>\r\n<html>\r\n<head>\r\n<meta charset="utf-8">\r\n<title>文档标题</title>\r\n</head>\r\n<body>\r\n\t<h1>我的第一个HTML页面</h1>\r\n\t<p>我的第一个段落。</p>\r\n</body>\r\n</html>\r\n'
    );
  });

  isautorun.setAttribute("checked", true);
  isautorun.addEventListener("change", (e) => {
    isautorun.setAttribute("checked", e.target.checked);
  });

  download.addEventListener("click", () => {
    const text = generateSrcDoc();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/html" }));
    a.download = "demo.html";
    a.click();
  });

  outputhHeader.addEventListener("click", (e) => {
    e.target.classList.contains("reset") && window.location.reload();
  });
  clear.addEventListener("click", () => {
    document.querySelector("#console code").textContent = "";
  });
  editorContainer.classList.remove("hidden");

  document.addEventListener("keydown", (e) => {
    if (e.key === "s" && e.ctrlKey) {
      e.preventDefault();
      formatDocument();
    }
  });
  outputIframe.addEventListener("keydown", (e) => {
    if (e.key === "s" && e.ctrlKey) {
      e.preventDefault();
      console.log("ctrl + s");
    }
  });

  const showTabs = (function (e) {
    return e.dataset && e.dataset.tabs
      ? e.dataset.tabs.split(",")
      : ["html", "css", "js"];
  })(editorContainer);
  const defaultTab = (function (e, t) {
    return e.dataset && e.dataset.defaultTab
      ? e.dataset.defaultTab
      : t.includes("js")
      ? "js"
      : "html";
  })(editorContainer, showTabs);
  (function (tabs, defaultTabEl) {
    if (defaultTabEl) {
      const defaultTabPanelEl = document.getElementById(
        defaultTabEl.id + "-panel"
      );
      defaultTabEl.setAttribute("aria-selected", !0);
      defaultTabEl.removeAttribute("tabindex");
      defaultTabPanelEl.classList.remove("hidden");
      defaultTabPanelEl.setAttribute("aria-hidden", false);
      defaultTabEl.focus();
    }
    for (const tab of tabs) {
      document.getElementById(tab).classList.remove("hidden");
    }
  })(showTabs, document.getElementById(defaultTab));
  tablistAddEventListener();
  createEditor();
  writeIframe();
})();

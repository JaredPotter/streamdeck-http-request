// https://github.com/elgatosf/streamdeck-pisamples/blob/master/Sources/com.elgato.pisamples.sdPlugin/index_pi.js

var websocket = null,
  uuid = null,
  actionInfo = {},
  inInfo = {},
  runningApps = [],
  settings = {},
  isQT = navigator.appVersion.includes("QtWebEngine"),
  onchangeevt = "onchange"; // 'oninput'; // change this, if you want interactive elements act on any change, or while they're modified

function connectElgatoStreamDeckSocket(
  inPort,
  inPluginUUID,
  inRegisterEvent,
  inInfo
) {
  pluginUUID = inPluginUUID;

  // Open the web socket
  websocket = new WebSocket("ws://127.0.0.1:" + inPort);

  function registerPlugin(inPluginUUID) {
    const json = {
      event: inRegisterEvent,
      uuid: inPluginUUID,
    };

    websocket.send(JSON.stringify(json));
  }

  websocket.onopen = function () {
    // WebSocket is connected, send message
    registerPlugin(pluginUUID);
  };

  websocket.onmessage = function (evt) {
    // Received message from Stream Deck
    const jsonObj = JSON.parse(evt.data);
    const event = jsonObj["event"];
    const action = jsonObj["action"];
    const context = jsonObj["context"];

    if (event == "keyDown") {
      const jsonPayload = jsonObj["payload"];
      const settings = jsonPayload["settings"];
      const coordinates = jsonPayload["coordinates"];
      const userDesiredState = jsonPayload["userDesiredState"];
      httpRequestAction.onKeyDown(
        context,
        settings,
        coordinates,
        userDesiredState
      );
    } else if (event == "keyUp") {
      const jsonPayload = jsonObj["payload"];
      const settings = jsonPayload["settings"];
      const coordinates = jsonPayload["coordinates"];
      const userDesiredState = jsonPayload["userDesiredState"];
      httpRequestAction.onKeyUp(
        context,
        settings,
        coordinates,
        userDesiredState
      );
    } else if (event == "willAppear") {
      const jsonPayload = jsonObj["payload"];
      const settings = jsonPayload["settings"];
      const coordinates = jsonPayload["coordinates"];
      httpRequestAction.onWillAppear(context, settings, coordinates);
    }
  };

  websocket.onclose = function () {
    // Websocket is closed
  };
}

window.addEventListener(
  "message",
  function (ev) {
    console.log("External window received message:  ", ev.data, typeof ev.data);
    if (ev.data === "initPropertyInspector") {
      initPropertyInspector(5);
    }
  },
  false
);

function openMeExternal() {
  window.xtWindow = window.open("index_pi.html", "PI Samples");
  setTimeout(
    () => window.xtWindow.postMessage("initPropertyInspector", "*"),
    1500
  );
}

function initPropertyInspector(initDelay) {
  prepareDOMElements(document);
  demoCanvas();
  /** expermimental carousel is not part of the DOM
   * so let the DOM get constructed first and then
   * inject the carousel */
  setTimeout(function () {
    initCarousel();
    initToolTips();
  }, initDelay || 100);
}

function revealSdpiWrapper() {
  const el = document.querySelector(".sdpi-wrapper");
  el && el.classList.remove("hidden");
}

// our method to pass values to the plugin
function sendValueToPlugin(value, param) {
  if (websocket && websocket.readyState === 1) {
    const json = {
      action: actionInfo["action"],
      event: "sendToPlugin",
      context: uuid,
      payload: {
        [param]: value,
      },
    };
    websocket.send(JSON.stringify(json));
  }
}

if (!isQT) {
  document.addEventListener("DOMContentLoaded", function () {
    initPropertyInspector(100);
  });
}

/** the beforeunload event is fired, right before the PI will remove all nodes */
window.addEventListener("beforeunload", function (e) {
  e.preventDefault();
  // since 4.1 this is no longer needed, as the plugin will receive a notification
  // right before the Property Inspector goes away
  sendValueToPlugin("propertyInspectorWillDisappear", "property_inspector");
  // Don't set a returnValue to the event, otherwise Chromium with throw an error.  // e.returnValue = '';
});

const addQueryParameterButtonElement = document.querySelector(
  "#addQueryParameterButton"
);

addQueryParameterButtonElement.addEventListener("click", () => {
  const queryParametersTable = document.querySelector("#queryParametersTable");

  // Create new Table Row (tr)
  const newQueryParameterRowElement = document.createElement("tr");

  const newQueryParameterCheckboxDataElement = document.createElement("td");
  newQueryParameterCheckboxDataElement.classList.add("start-and-end-row");
  const newQueryParameterCheckboxInputElement = document.createElement("input");
  const newQueryParameterCheckboxLabelElement = document.createElement("label");
  newQueryParameterCheckboxLabelElement.classList.add("sdpi-item-label");
  const newQueryParameterCheckboxLabelSpanElement = document.createElement(
    "span"
  );

  newQueryParameterCheckboxLabelElement.appendChild(
    newQueryParameterCheckboxLabelSpanElement
  );

  const uuid = uuidv4();
  newQueryParameterCheckboxInputElement.id = uuid;
  newQueryParameterCheckboxInputElement.setAttribute("type", "checkbox");
  newQueryParameterCheckboxInputElement.setAttribute("value", "checked");

  newQueryParameterCheckboxLabelElement.setAttribute("for", uuid);

  // input -> td
  newQueryParameterCheckboxDataElement.appendChild(
    newQueryParameterCheckboxInputElement
  );
  // label -> td
  newQueryParameterCheckboxDataElement.appendChild(
    newQueryParameterCheckboxLabelElement
  );

  // KEY INPUT
  const newQueryParameterKeyDataElement = document.createElement("td");
  newQueryParameterKeyDataElement.classList.add("key-value-input");
  const newQueryParameterKeyInputElement = document.createElement("input");
  newQueryParameterKeyInputElement.setAttribute("type", "text");
  newQueryParameterKeyDataElement.appendChild(newQueryParameterKeyInputElement);

  // VALUE INPUT
  const newQueryParameterValueDataElement = document.createElement("td");
  newQueryParameterValueDataElement.classList.add("key-value-input");
  const newQueryParameterValueInputElement = document.createElement("input");
  newQueryParameterValueInputElement.setAttribute("type", "text");
  newQueryParameterValueDataElement.appendChild(
    newQueryParameterValueInputElement
  );

  // X Delete
  const newQueryParameterDeleteDataElement = document.createElement("td");
  newQueryParameterDeleteDataElement.classList.add(
    "start-and-end-row",
    "delete-item"
  );
  const newQueryParameterDeleteSpanElement = document.createElement("span");
  newQueryParameterDeleteSpanElement.innerText = "X";
  newQueryParameterDeleteDataElement.appendChild(
    newQueryParameterDeleteSpanElement
  );

  newQueryParameterDeleteDataElement.addEventListener("click", () => {
    newQueryParameterRowElement.remove();

    // todo: remove saved details about row
  });

  // Append all td
  newQueryParameterRowElement.appendChild(newQueryParameterCheckboxDataElement);
  newQueryParameterRowElement.appendChild(newQueryParameterKeyDataElement);
  newQueryParameterRowElement.appendChild(newQueryParameterValueDataElement);
  newQueryParameterRowElement.appendChild(newQueryParameterDeleteDataElement);

  queryParametersTable.appendChild(newQueryParameterRowElement);
});

/* ~~~~~~~~ HEADER ~~~~~~~~~~~~~ */
const addHeaderButtonElement = document.querySelector("#addHeaderButton");

addHeaderButtonElement.addEventListener("click", () => {
  const headersTable = document.querySelector("#headersTable");

  // Create new Table Row (tr)
  const newHeaderRowElement = document.createElement("tr");

  const newHeaderCheckboxDataElement = document.createElement("td");
  newHeaderCheckboxDataElement.classList.add("start-and-end-row");
  const newHeaderCheckboxInputElement = document.createElement("input");
  const newHeaderCheckboxLabelElement = document.createElement("label");
  newHeaderCheckboxLabelElement.classList.add("sdpi-item-label");
  const newHeaderCheckboxLabelSpanElement = document.createElement("span");

  newHeaderCheckboxLabelElement.appendChild(newHeaderCheckboxLabelSpanElement);

  const uuid = uuidv4();
  newHeaderCheckboxInputElement.id = uuid;
  newHeaderCheckboxInputElement.setAttribute("type", "checkbox");
  newHeaderCheckboxInputElement.setAttribute("value", "checked");

  newHeaderCheckboxLabelElement.setAttribute("for", uuid);

  // input -> td
  newHeaderCheckboxDataElement.appendChild(newHeaderCheckboxInputElement);
  // label -> td
  newHeaderCheckboxDataElement.appendChild(newHeaderCheckboxLabelElement);

  // KEY INPUT
  const newHeaderKeyDataElement = document.createElement("td");
  newHeaderKeyDataElement.classList.add("key-value-input");
  const newHeaderKeyInputElement = document.createElement("input");
  newHeaderKeyInputElement.setAttribute("type", "text");
  newHeaderKeyDataElement.appendChild(newHeaderKeyInputElement);

  // VALUE INPUT
  const newHeaderValueDataElement = document.createElement("td");
  newHeaderValueDataElement.classList.add("key-value-input");
  const newHeaderValueInputElement = document.createElement("input");
  newHeaderValueInputElement.setAttribute("type", "text");
  newHeaderValueDataElement.appendChild(newHeaderValueInputElement);

  // X Delete
  const newHeaderDeleteDataElement = document.createElement("td");
  newHeaderDeleteDataElement.classList.add("start-and-end-row", "delete-item");
  const newHeaderDeleteSpanElement = document.createElement("span");
  newHeaderDeleteSpanElement.innerText = "X";
  newHeaderDeleteDataElement.appendChild(newHeaderDeleteSpanElement);

  newHeaderDeleteDataElement.addEventListener("click", () => {
    newHeaderRowElement.remove();

    // todo: remove saved details about row
  });

  // Append all td
  newHeaderRowElement.appendChild(newHeaderCheckboxDataElement);
  newHeaderRowElement.appendChild(newHeaderKeyDataElement);
  newHeaderRowElement.appendChild(newHeaderValueDataElement);
  newHeaderRowElement.appendChild(newHeaderDeleteDataElement);

  headersTable.appendChild(newHeaderRowElement);
});

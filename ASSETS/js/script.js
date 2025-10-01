// ==============  MODEL  ===============


// #region MODEL

// Dummy data (fallback)
const DUMMYDATA = [];

// App state
let appState = "listView";
let activeList = 0;

// LocalStorage helpers
function readLists() {
  const lists = localStorage.getItem("todoLists");
  return lists ? JSON.parse(lists) : [];
}

function saveData(lists) {
  localStorage.setItem("todoLists", JSON.stringify(lists));
}

// #endregion MODEL



// ============ CONTROLLER ==============


// #region CONTROLLER

// Initialize App
function init() {
  BuildStaticView(); 
  GetDarkmode();     // set correct theme + label on first paint
  BuildListView();   // default route
}

// Central static buttons callback
function buttonCallback(action) {
  switch (action) {
    case "back":
      if (appState === "itemView") {
        BuildListView();
      }
      break;

    case "toggleTheme":
      ToggleTheme();
      break;

    case "addList":
      if (appState === "listView") {
        createNewList();
      } else if (appState === "itemView") {
        createNewItem();
      }
      break;

    case "newListInput":
      submitNewList();
      BuildListView();
      break;

    default:
      console.error("Unknown action:", action);
  }
}

// List card menu actions
function listClickCallback(action, index) {
  switch (action) {
    case "showList":
      activeList = index;
      listItemView(index);
      break;

    case "listMenu":
      // reserved for future
      break;

    case "editList":
      editList(index);
      break;

    case "deleteList":
      deleteList(index);
      break;

    default:
      console.error("Unknown action:", action);
  }
}


// ---------- Create & Submit (Lists) ----------

function submitNewList(event) {
  if (event) event.preventDefault();
  const input = document.getElementById("newListInput");
  const title = (input?.value || "").trim();
  if (!title) return;

  const lists = readLists();
  lists.push({
    id: Date.now(),
    title,
    items: []
  });

  saveData(lists);
  BuildListView();
}


// ---------- Create & Submit (Items) ----------

function submitNewItem(event) {
  if (event) event.preventDefault();
  const input = document.getElementById("newItemInput");
  const itemText = (input?.value || "").trim();
  if (!itemText) return;

  const lists = readLists();
  if (!lists[activeList]) {
    console.error("Active list not found");
    return;
  }

  const newItem = {
    id: Date.now(),
    text: itemText,
    completed: false
  };

  lists[activeList].items.push(newItem);
  saveData(lists);
  listItemView(activeList);
}


// ---------- Edit List (inline) ----------

function editList(listIndex) {
  const lists = readLists();
  const list = lists[listIndex];
  if (!list) {
    console.error("List not found");
    return;
  }

  const listCards = document.querySelectorAll(".list-card");
  const listCard = listCards[listIndex];
  if (!listCard) {
    console.error("List card not found");
    return;
  }

  const h2 = listCard.querySelector("h2");
  const currentTitle = h2.textContent;

  h2.outerHTML = `<input type="text" id="editListInput-${listIndex}" value="${currentTitle}" class="edit-list-input" onkeypress="handleEditListKeypress(event, ${listIndex})">`;

  const dropdown = listCard.querySelector(".dropdown");
  dropdown.outerHTML = `<img src="ASSETS/svg/createButton.svg" alt="Confirm" onclick="confirmEditList(${listIndex})" class="create-form-icon" />`;

  const input = document.getElementById(`editListInput-${listIndex}`);
  input.focus();
  input.select();
}

function handleEditListKeypress(event, listIndex) {
  if (event.key === "Enter") {
    confirmEditList(listIndex);
  }
}

function confirmEditList(listIndex) {
  const input = document.getElementById(`editListInput-${listIndex}`);
  const newTitle = (input?.value || "").trim();

  if (!newTitle) {
    BuildListView(); // cancel edit
    return;
  }

  const lists = readLists();
  lists[listIndex].title = newTitle;
  saveData(lists);
  BuildListView();
}

function deleteList(listIndex) {
  const lists = readLists();
  if (lists[listIndex]) {
    lists.splice(listIndex, 1);
    saveData(lists);
    BuildListView();
  }
}


// ---------- Edit/Delete/Toggle Items ----------

function editItem(listIndex, itemIndex) {
  const lists = readLists();
  const item = lists[listIndex]?.items[itemIndex];
  if (!item) {
    console.error("Item not found");
    return;
  }

  const itemCards = document.querySelectorAll(".item-card");
  const itemCard = itemCards[itemIndex];
  if (!itemCard) {
    console.error("Item card not found");
    return;
  }

  const itemText = itemCard.querySelector(".item-text");
  const currentText = itemText.textContent;

  itemText.outerHTML = `<input type="text" id="editItemInput-${itemIndex}" value="${currentText}" class="edit-item-input" onkeypress="handleEditItemKeypress(event, ${listIndex}, ${itemIndex})">`;

  const dropdown = itemCard.querySelector(".dropdown");
  dropdown.outerHTML = `<img src="ASSETS/svg/createButton.svg" alt="Confirm" onclick="confirmEditItem(${listIndex}, ${itemIndex})" class="create-form-icon" />`;

  const input = document.getElementById(`editItemInput-${itemIndex}`);
  input.focus();
  input.select();
}

function handleEditItemKeypress(event, listIndex, itemIndex) {
  if (event.key === "Enter") {
    confirmEditItem(listIndex, itemIndex);
  }
}

function handleNewListKeypress(event) {
  if (event.key === "Enter") {
    submitNewList(event);
  }
}

function handleNewItemKeypress(event) {
  if (event.key === "Enter") {
    submitNewItem(event);
  }
}

function confirmEditItem(listIndex, itemIndex) {
  const input = document.getElementById(`editItemInput-${itemIndex}`);
  const newText = (input?.value || "").trim();

  if (!newText) {
    listItemView(activeList); // cancel
    return;
  }

  const lists = readLists();
  lists[listIndex].items[itemIndex].text = newText;
  saveData(lists);
  listItemView(activeList);
}

function deleteItem(listIndex, itemIndex) {
  const lists = readLists();
  if (lists[listIndex] && lists[listIndex].items[itemIndex]) {
    lists[listIndex].items.splice(itemIndex, 1);
    saveData(lists);
    listItemView(activeList);
  }
}

function toggleItemComplete(listIndex, itemIndex) {
  const lists = readLists();
  if (lists[listIndex] && lists[listIndex].items[itemIndex]) {
    lists[listIndex].items[itemIndex].completed = !lists[listIndex].items[itemIndex].completed;
    saveData(lists);
    listItemView(activeList);
  }
}


// ---------- Dropdown handling (global) ----------

let dropdownListenersAttached = false;

function toggleDropdown(event, dropdownId) {
  event.stopPropagation();

  // Close others
  document.querySelectorAll(".dropdown-content").forEach((d) => {
    if (d.id !== dropdownId) d.style.display = "none";
  });

  const dropdown = document.getElementById(dropdownId);
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

function setupDropdownListeners() {
  if (dropdownListenersAttached) return; // avoid multiple bindings

  // Click outside to close
  document.addEventListener("click", function (event) {
    if (!event.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown-content").forEach((d) => (d.style.display = "none"));
    }
  });

  // Close when clicking any option
  document.addEventListener("click", function (event) {
    const option = event.target.closest(".dropdown-content div");
    if (option) {
      document.querySelectorAll(".dropdown-content").forEach((d) => (d.style.display = "none"));
    }
  });

  dropdownListenersAttached = true;
}

// Boot
init();

// #endregion CONTROLLER



// ================ VIEW =================

// #region VIEW

// Clear HTML (root)
function ClearHtml() {
  document.body.innerHTML = "";
}

// Static html structure
function BuildStaticView() {
  document.body.innerHTML =
    '<header>' +
    '<h1 id="Logo">ToDo</h1>' +
    '<div class="ButtonContainer">' +
    '<div id="BackButton" onclick="buttonCallback(\'back\')">' +
    '<img src="ASSETS/svg/back.svg" alt="Back" />' +
    '</div>' +
    '<div id="DarkModeButton" onclick="buttonCallback(\'toggleTheme\')">' +
    '<span class="toggle-text">Light</span>' +
    '<span class="toggle-circle"></span>' +
    "</div>" +
    "</div>" +
    "</header>" +
    '<section id="mainContainer"></section>' +
    "<footer>" +
    '<div id="AddButton" onclick="buttonCallback(\'addList\')">' +
    '<img src="ASSETS/svg/addButton.svg" alt="Add" />' +
    '</div>' +
    "</footer>";
}


// Darkmode view

function GetDarkmode() {
  const element = document.body;
  const textEl = document.querySelector("#DarkModeButton .toggle-text");
  if (localStorage.getItem("theme") === "dark") {
    element.classList.add("darkmode");
    if (textEl) textEl.textContent = "Dark";
  } else {
    element.classList.remove("darkmode");
    if (textEl) textEl.textContent = "Light";
  }
}

function SetDarkmode() {
  document.body.classList.add("darkmode");
  localStorage.setItem("theme", "dark");
}

function ToggleTheme() {
  const element = document.body;
  const textEl = document.querySelector("#DarkModeButton .toggle-text");

  if (localStorage.getItem("theme") === "dark") {
    localStorage.setItem("theme", "light");
    element.classList.remove("darkmode");
    if (textEl) textEl.textContent = "Light";
  } else {
    localStorage.setItem("theme", "dark");
    element.classList.add("darkmode");
    if (textEl) textEl.textContent = "Dark";
  }
}


// -------- List View --------

function BuildListView() {
  appState = "listView";
  ClearHtml();
  BuildStaticView();
  GetDarkmode();

  const mainContainer = document.getElementById("mainContainer");
  const backButton = document.getElementById("BackButton");
  backButton.classList.add("lowOpacity");

  const lists = readLists().length ? readLists() : DUMMYDATA;

  lists.forEach((list, index) => {
    const title = list.title ?? list.name ?? "Untitled";
    const listCard = `
      <div class="list-card">
        <h2 onclick="listClickCallback('showList', ${index})">${title}</h2>
        <div class="dropdown">
          <div class="dropbtn" onclick="toggleDropdown(event, 'list-${index}')">
            <img src="ASSETS/svg/menu.svg" alt="Menu" />
          </div>
          <div class="dropdown-content" id="list-${index}">
            <div id="EditButton${index}" onclick="listClickCallback('editList', ${index})">
              <img src="ASSETS/svg/edit.svg" alt="Edit" />
            </div>
            <div id="DeleteButton${index}" onclick="listClickCallback('deleteList', ${index})">
              <img src="ASSETS/svg/delete.svg" alt="Delete" />
            </div>
          </div>
        </div>
      </div>
    `;
    mainContainer.insertAdjacentHTML("beforeend", listCard);
  });

  setupDropdownListeners();
}

function listItemView(index) {
  appState = "itemView";

  const mainContainer = document.getElementById("mainContainer");
  const backButton = document.getElementById("BackButton");

  backButton.classList.remove("lowOpacity");
  mainContainer.innerHTML = "";

  const lists = readLists().length ? readLists() : DUMMYDATA;
  const currentList = lists[index];

  if (!currentList) {
    mainContainer.innerHTML = "<p>List not found</p>";
    return;
  }

  const title = currentList.title ?? currentList.name ?? "Untitled";

  let itemsHTML = "";
  if (currentList.items && currentList.items.length > 0) {
    currentList.items.forEach((item, itemIndex) => {
      const isCompleted = !!item.completed;
      const completedClass = isCompleted ? " completed" : "";
      const text = item.text ?? item.name ?? String(item);

      itemsHTML += `
        <div class="item-card${completedClass}">
          <div class="item-content">
            <input type="checkbox"
                   class="item-checkbox"
                   ${isCompleted ? "checked" : ""}
                   onchange="toggleItemComplete(${index}, ${itemIndex})" />
            <span class="item-text">${text}</span>
          </div>
          <div class="dropdown">
            <div class="dropbtn" onclick="toggleDropdown(event, 'item-${index}-${itemIndex}')">
              <img src="ASSETS/svg/menu.svg" alt="Menu" />
            </div>
            <div class="dropdown-content" id="item-${index}-${itemIndex}">
              <div onclick="editItem(${index}, ${itemIndex})">
                <img src="ASSETS/svg/edit.svg" alt="Edit" />
              </div>
              <div onclick="deleteItem(${index}, ${itemIndex})">
                <img src="ASSETS/svg/delete.svg" alt="Delete" />
              </div>
            </div>
          </div>
        </div>
      `;
    });
  } else {
    itemsHTML = '<div class="empty-state">No items in this list yet. Add some items!</div>';
  }

  mainContainer.innerHTML = `
    <div class="list-view">
      <div class="list-header">
        <h1>${title}</h1>
      </div>
      <div class="items-container">
        ${itemsHTML}
      </div>
    </div>
  `;

  setupDropdownListeners();
}


// -------- Inline Create Forms (List / Item) --------

function createNewList() {
  const main = document.getElementById("mainContainer");
  if (document.getElementById("createListForm")) return;

  const html = `
    <div class="list-card" id="createListForm">
      <input type="text" id="newListInput" placeholder="Enter list name..." required class="edit-item-input" onkeypress="handleNewListKeypress(event)">
      <div class="dropdown">
        <img src="ASSETS/svg/createButton.svg" alt="Create" onclick="submitNewList(event)" class="create-form-icon" />
        <img src="ASSETS/svg/xmark-solid-full.svg" alt="Cancel" onclick="document.getElementById('createListForm').remove()" class="create-form-icon cancel-icon" />
      </div>
    </div>
  `;
  main.insertAdjacentHTML("afterbegin", html);
  document.getElementById("newListInput").focus();
}

function createNewItem() {
  const main = document.getElementById("mainContainer");
  const view = main.querySelector(".list-view");
  if (!view) return;
  if (document.getElementById("createItemForm")) return;

  const createItemForm = `
    <div class="item-card" id="createItemForm">
      <div class="item-content">
        <input type="checkbox" class="item-checkbox" disabled />
        <input type="text" id="newItemInput" placeholder="Enter item text..." required class="edit-item-input" onkeypress="handleNewItemKeypress(event)">
      </div>
      <div class="dropdown">
        <img src="ASSETS/svg/createButton.svg" alt="Create" onclick="submitNewItem(event)" class="create-form-icon" />
        <img src="ASSETS/svg/xmark-solid-full.svg" alt="Cancel" onclick="document.getElementById('createItemForm').remove()" class="create-form-icon cancel-icon" />
      </div>
    </div>
  `;

  const itemsContainer = view.querySelector(".items-container");
  itemsContainer.insertAdjacentHTML("afterbegin", createItemForm);
  document.getElementById("newItemInput").focus();
}

// #endregion VIEW

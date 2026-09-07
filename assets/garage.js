const GARAGE_STORAGE_KEY = "detailix_garage_v1";

let vehiclesData = null;
let garageState = { activeIndex: -1, vehicles: [] };

function loadGarage() {
  try {
    const raw = localStorage.getItem(GARAGE_STORAGE_KEY);
    garageState = raw ? JSON.parse(raw) : { activeIndex: -1, vehicles: [] };
  } catch (err) {
    console.warn("Garage : localStorage indisponible, le garage ne sera pas conservé après rechargement.", err);
    garageState = { activeIndex: -1, vehicles: [] };
  }
}

function saveGarage() {
  try {
    localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify(garageState));
  } catch (err) {
    console.warn("Garage : impossible d'enregistrer dans localStorage.", err);
  }
}

function notifyGarageChanged() {
  window.dispatchEvent(new CustomEvent("garage:changed"));
}

function getActiveVehicle() {
  return garageState.vehicles[garageState.activeIndex] || null;
}

function addVehicleToGarage(vehicle) {
  garageState.vehicles.push(vehicle);
  garageState.activeIndex = garageState.vehicles.length - 1;
  saveGarage();
  renderGarageList();
  renderGarageToggle();
  notifyGarageChanged();
}

function removeVehicleFromGarage(index) {
  garageState.vehicles.splice(index, 1);
  if (garageState.activeIndex === index) {
    garageState.activeIndex = garageState.vehicles.length ? 0 : -1;
  } else if (garageState.activeIndex > index) {
    garageState.activeIndex -= 1;
  }
  saveGarage();
  renderGarageList();
  renderGarageToggle();
  notifyGarageChanged();
}

function setActiveVehicle(index) {
  garageState.activeIndex = index;
  saveGarage();
  renderGarageList();
  renderGarageToggle();
  notifyGarageChanged();
}

function populateModelSelect(makeId) {
  const modelSelect = document.getElementById("vehModelSelect");
  const motorSelect = document.getElementById("vehMotorSelect");
  const codeMoteurEl = document.getElementById("vehCodeMoteur");
  modelSelect.innerHTML = '<option value="">Modèle</option>';
  motorSelect.innerHTML = '<option value="">Motorisation</option>';
  codeMoteurEl.textContent = "";
  motorSelect.disabled = true;
  document.getElementById("addVehicleBtn").disabled = true;

  const make = vehiclesData.makes.find((m) => m.id === makeId);
  if (!make) {
    modelSelect.disabled = true;
    return;
  }
  modelSelect.disabled = false;
  make.models.forEach((model) => {
    const opt = document.createElement("option");
    opt.value = model.id;
    opt.textContent = model.name;
    modelSelect.appendChild(opt);
  });
}

function populateMotorSelect(makeId, modelId) {
  const motorSelect = document.getElementById("vehMotorSelect");
  const codeMoteurEl = document.getElementById("vehCodeMoteur");
  motorSelect.innerHTML = '<option value="">Motorisation</option>';
  codeMoteurEl.textContent = "";
  document.getElementById("addVehicleBtn").disabled = true;

  const make = vehiclesData.makes.find((m) => m.id === makeId);
  const model = make ? make.models.find((mo) => mo.id === modelId) : null;
  if (!model) {
    motorSelect.disabled = true;
    return;
  }
  motorSelect.disabled = false;
  model.motorisations.forEach((moteur) => {
    const opt = document.createElement("option");
    opt.value = moteur.id;
    opt.textContent = moteur.label;
    motorSelect.appendChild(opt);
  });
}

function renderGarageList() {
  const listEl = document.getElementById("garageList");
  if (garageState.vehicles.length === 0) {
    listEl.innerHTML = '<p class="garage-empty">Aucun véhicule enregistré.</p>';
    return;
  }
  listEl.innerHTML = garageState.vehicles
    .map(
      (v, i) => `
      <div class="garage-chip${i === garageState.activeIndex ? " active" : ""}" data-index="${i}">
        <button type="button" class="garage-chip-select" data-action="select" data-index="${i}">${escapeHtml(v.label)}</button>
        <button type="button" class="garage-chip-remove" data-action="remove" data-index="${i}" aria-label="Retirer ce véhicule">✕</button>
      </div>`
    )
    .join("");
}

function renderGarageToggle() {
  const active = getActiveVehicle();
  const toggle = document.getElementById("garageToggle");
  toggle.classList.toggle("has-active", !!active);
  toggle.title = active ? `Véhicule actif : ${active.label}` : "Mon garage";
}

function openGaragePanel() {
  document.getElementById("garagePanel").hidden = false;
  requestAnimationFrame(() => document.getElementById("garagePanel").classList.add("visible"));
}

function closeGaragePanel() {
  const panel = document.getElementById("garagePanel");
  panel.classList.remove("visible");
  setTimeout(() => {
    panel.hidden = true;
  }, 200);
}

function initGarage(data) {
  vehiclesData = data;
  loadGarage();

  const makeSelect = document.getElementById("vehMakeSelect");
  vehiclesData.makes.forEach((make) => {
    const opt = document.createElement("option");
    opt.value = make.id;
    opt.textContent = make.name;
    makeSelect.appendChild(opt);
  });

  makeSelect.addEventListener("change", () => populateModelSelect(makeSelect.value));
  document.getElementById("vehModelSelect").addEventListener("change", () => {
    populateMotorSelect(makeSelect.value, document.getElementById("vehModelSelect").value);
  });
  document.getElementById("vehMotorSelect").addEventListener("change", (e) => {
    const makeId = makeSelect.value;
    const modelId = document.getElementById("vehModelSelect").value;
    const make = vehiclesData.makes.find((m) => m.id === makeId);
    const model = make ? make.models.find((mo) => mo.id === modelId) : null;
    const motorisation = model ? model.motorisations.find((mo) => mo.id === e.target.value) : null;
    document.getElementById("vehCodeMoteur").textContent = motorisation ? `Code moteur : ${motorisation.codeMoteur}` : "";
    document.getElementById("addVehicleBtn").disabled = !motorisation;
  });

  document.getElementById("addVehicleBtn").addEventListener("click", () => {
    const makeId = makeSelect.value;
    const modelId = document.getElementById("vehModelSelect").value;
    const motorId = document.getElementById("vehMotorSelect").value;
    const make = vehiclesData.makes.find((m) => m.id === makeId);
    const model = make ? make.models.find((mo) => mo.id === modelId) : null;
    const motorisation = model ? model.motorisations.find((mo) => mo.id === motorId) : null;
    if (!make || !model || !motorisation) return;
    addVehicleToGarage({
      makeId,
      modelId,
      motorisationId: motorId,
      codeMoteur: motorisation.codeMoteur,
      label: `${make.name} ${model.name} · ${motorisation.label}`,
    });
    showToast("Véhicule ajouté à votre garage");
  });

  document.getElementById("garageList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const index = Number(btn.dataset.index);
    if (btn.dataset.action === "select") setActiveVehicle(index);
    else if (btn.dataset.action === "remove") removeVehicleFromGarage(index);
  });

  document.getElementById("garageToggle").addEventListener("click", () => {
    const panel = document.getElementById("garagePanel");
    if (panel.hidden) openGaragePanel();
    else closeGaragePanel();
  });

  document.addEventListener("click", (e) => {
    const panel = document.getElementById("garagePanel");
    if (panel.hidden) return;
    if (!panel.contains(e.target) && e.target.id !== "garageToggle" && !e.target.closest("#garageToggle")) {
      closeGaragePanel();
    }
  });

  renderGarageList();
  renderGarageToggle();
}

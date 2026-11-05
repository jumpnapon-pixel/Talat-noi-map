// Starts the app. The visitor map renders immediately from the edition built into the page;
// storage (and with it the editor) lights up when the hosting runtime answers.
const mapStorePromise = createMapStore();
ReactDOMClient.createRoot(document.getElementById("root")).render(h(TalatNoiApp, { storePromise: mapStorePromise }));

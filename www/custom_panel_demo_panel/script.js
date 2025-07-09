function startRecording() {
  const device = document.getElementById("device").value;
  const action = document.getElementById("action").value;

  document.getElementById("status").innerText = `Waiting for event... (Device: ${device}, Action: ${action})`;

  // Here you'd trigger a Home Assistant service call or wait for a WebSocket event
  // This is just placeholder logic
  setTimeout(() => {
    document.getElementById("status").innerText = `Event received and data stored for "${device}" / "${action}"`;
  }, 2000);
}

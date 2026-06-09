(function () {
  const betaAlertButtons = document.querySelectorAll('[data-beta-alert]');

  betaAlertButtons.forEach(function bindBetaAlert(button) {
    button.addEventListener('click', function showBetaAlert() {
      window.alert(button.dataset.betaAlert || 'PiLord beta will open later this year.');
    });
  });
})();

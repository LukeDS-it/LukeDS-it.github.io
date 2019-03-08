(function () {
    var toggled = false;
    var toggler = document.getElementById("btnMenu");
    var menu = document.getElementById("drawer");

    toggler.onclick = toggle;

    function toggle() {
        toggled = !toggled;
        if (toggled) {
            menu.classList.add("opened")
        } else {
            menu.classList.remove("opened")
        }
    }
})();

﻿function getSelected(container) {
    const list = []
    console.log(container)
    container.find("li.active").each(function (idx, li) {
        list.push($(li).attr("value"));
    })
    return list
}

function initListGroup(container) {
    container.find('.list-group-item').each(function () {
        initListGroupItem($(this))
    });
}

//For now copied from: http://bootsnipp.com/snippets/featured/checked-list-group
function initListGroupItem(item) {
    var $widget = item,
        $checkbox = $('<input type="checkbox" class="hidden" />'),
        color = ($widget.data('color') ? $widget.data('color') : "primary"),
        style = ($widget.data('style') == "button" ? "btn-" : "list-group-item-"),
        settings = {
            on: {
                icon: 'oi oi-check'
            },
            off: {
                icon: 'oi oi-check'
            }
        };

    $widget.css('cursor', 'pointer')
    $widget.append($checkbox);

    // Event Handlers
    $widget.on('click', function () {
        $checkbox.prop('checked', !$checkbox.is(':checked'));
        $checkbox.triggerHandler('change');
        updateDisplay();
    });
    $checkbox.on('change', function () {
        updateDisplay();
    });


    // Actions
    function updateDisplay() {
        var isChecked = $checkbox.is(':checked');

        // Set the button's state
        $widget.data('state', (isChecked) ? "on" : "off");

        // Set the button's icon
        $widget.find('.state-icon')
            .removeClass()
            .addClass('state-icon ' + settings[$widget.data('state')].icon);

        // Update the button's color
        if (isChecked) {
            $widget.addClass(style + color + ' active');
        } else {
            $widget.removeClass(style + color + ' active');
        }
    }

    // Initialization
    function init() {

        if ($widget.data('checked') == true) {
            $checkbox.prop('checked', !$checkbox.is(':checked'));
        }

        updateDisplay();

        // Inject the icon if applicable
        if ($widget.find('.state-icon').length == 0) {
            $widget.prepend('<span class="state-icon ' + settings[$widget.data('state')].icon + '"></span>');
        }
    }
    init();
}
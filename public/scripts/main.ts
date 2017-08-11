declare var $
declare var io

interface HtmlResponse {
    success: boolean,
    html?: string,
    err?: string
}

const socket = io()

$(document).ready(init)

function init() {
    if ($("#profileImageID").get().length > 0) {
        $('#profileImageID').text(getInitials())
        $('#profileImageID').css("background-color", intToRGB(hashCode(getName())))
    }

    $(".socketSender").click(function(){
        const sender = $(this)
        const ID = sender.attr("socketID")
        const data = sender.attr("socketData")
        
        socket.emit(ID, data)
    })

    socket.on('socketSenderDone', (success, err) => {
        if(success) location.reload()
        else {
            //add way to catch generic error, open model with message orso
        }
    })
}

function href(to: string) {
    document.location.href = to
}

function hashCode(str:string):number {
    let hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return hash;
}

function intToRGB(i): string {
    Random.setRandomSeed(i)
    const rand = () => Math.floor((Random.random(0, 255) + 32) / 2)
    return "rgb(" + rand() + "," + rand() + "," + rand() + ")"
}

function getInitials(): string {
    return $('#profileImageID').attr("name").substring(0, 1) +
        $('#profileImageID').attr("family").substring(0, 1)
}

function getName(): string {
    return $('#profileImageID').attr("family") + " " + $('#profileImageID').attr("name")        
}

namespace Random {
    var SEED: number = 0;

    export function setRandomSeed(seed: number) {
        SEED = Math.abs(seed);
    }

    export function random(min: number = 0, max: number = 1): number {
        SEED = (SEED * 9301 + 49297) % 233280;
        const rnd = SEED / 233280;
        return min + rnd * (max - min);
    }
}
export function reloadPage(reloadCss = true) {
    window.location.reload();
    if (reloadCss) {
        let messageId = Date.now();
        let links = document.getElementsByTagName('link');
        for (let i = 0; i < links.length; i++) {
            let link = links[i];
            if (link.rel !== 'stylesheet') continue;
            let clonedLink = link.cloneNode(true);
            let newHref = link.href.replace(/(&|\?)__reload=\d+/, "$1__reload=" + messageId);
            if (newHref !== link.href) {
                alert('no equal path')
                clonedLink.href = newHref;

            } else {
                alert('this path')
                let indexOfQuest = newHref.indexOf('?');
                if (indexOfQuest >= 0) {
                    // to support ?foo#hash
                    clonedLink.href = newHref.substring(0, indexOfQuest + 1) + '__reload=' + messageId + '&' + newHref.substring(indexOfQuest + 1);
                } else {
                    clonedLink.href += '?' + '__reload=' + messageId;
                }
            }
            link.replaceWith(clonedLink);
        }
    }
}

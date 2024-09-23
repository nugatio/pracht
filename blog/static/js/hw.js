document.addEventListener('DOMContentLoaded', function() {
    const wordToHighlight = 'Pracht';
    const highlightColor = getComputedStyle(document.documentElement).getPropertyValue('--n').trim();

    function highlightWord(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (text.includes(wordToHighlight)) {
                const fragment = document.createDocumentFragment();
                let lastIndex = 0;
                text.split(wordToHighlight).forEach((part, index) => {
                    fragment.appendChild(document.createTextNode(part));
                    if (index < text.split(wordToHighlight).length - 1) {
                        const span = document.createElement('span');
                        span.textContent = wordToHighlight;
                        span.style.color = highlightColor;
                        fragment.appendChild(span);
                    }
                    lastIndex = index;
                });
                node.parentNode.replaceChild(fragment, node);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE && !['SCRIPT', 'STYLE'].includes(node.tagName)) {
            Array.from(node.childNodes).forEach(highlightWord);
        }
    }

    const contentElement = document.querySelector('.articleContent');
    if (contentElement) {
        highlightWord(contentElement);
    }
});
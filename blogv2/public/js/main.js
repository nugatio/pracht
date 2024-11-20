document.addEventListener("DOMContentLoaded", () => {
    // Intercept link clicks
    document.body.addEventListener("click", (event) => {
        const target = event.target.closest("a");
        if (target && target.hostname === window.location.hostname) {
            event.preventDefault();
            loadPage(target.href);
        }
    });

    // Function to load a new page dynamically
    async function loadPage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Network error");
            const html = await response.text();

            // Extract and replace the main block
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const newContent = doc.querySelector("main");
            const mainBlock = document.querySelector("main");
            if (newContent && mainBlock) {
                mainBlock.innerHTML = newContent.innerHTML;
                window.history.pushState(null, "", url);
            }
        } catch (error) {
            console.error("Failed to load page:", error);
        }
    }

    // Handle browser back/forward navigation
    window.addEventListener("popstate", () => {
        loadPage(window.location.href);
    });
});

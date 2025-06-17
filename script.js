const searchButton = document.getElementById('search');
        let publisher = document.getElementById('publisher');
        const results = document.getElementById('results');
        const mainText = document.querySelector('.main-text');
        const DomParser = new DOMParser();
        const searchErrorMessage = 'Došlo je do greške prilikom pretrage. Molimo pokušajte ponovo kasnije.'
        const textForMain = `Unesi izdavaca i saznaj sta izlazi ${new Date().getFullYear()} godine :)`;
        mainText.textContent = textForMain;


        const searchForData = async (publisherName, offset) => {
            try {
                const targetUrl = `https://plus.cobiss.net/cobiss/sr/sr/bib/search/advanced?ax&ti&pu=${publisherName}&db=cobib&mat=allmaterials&max=100&pdfrom=01.01.2025&start=${offset}`;
                const searchData = await fetch(targetUrl, {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    }
                });

                if (searchData.ok) {
                    return await searchData.text();
                } else {
                    throw new Error(searchErrorMessage);
                }
            }
            catch (error) {
                throw(error);
            }
        };

        const parseResultsBody = (searchData) => {
            try {
                const doc = DomParser.parseFromString(searchData, 'text/html');

                return doc.getElementById('resultBodyList');
            }
            catch (error) {
                throw new Error(searchErrorMessage);
            }
        }

        const showResults = (searchBody) => {
            try {
                for (const result of searchBody.children) {
                    const title = result.dataset.title;
                    const titleDiv = document.createElement('div');
                    titleDiv.className = 'flex w-full p-3 mb-2 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50';
                    titleDiv.textContent = title;
                    results.insertAdjacentHTML('beforeend', titleDiv.outerHTML);
                } 
            }
            catch (error) {
                throw new Error(searchErrorMessage);
            }        
        };

        const search = async (e, currentOffset = 0) => {
            try {
                if (publisher.value.length > 0) {
                    if (currentOffset === 0) {
                        results.innerHTML = '';
                    }

                    const searchData = await searchForData(publisher.value, currentOffset);
                    const searchBody = parseResultsBody(searchData);

                    if (searchBody.children.length === 0 && currentOffset === 0) {
                        alert('Nema rezultata za traženog izdavača.');
                        return;
                    } else if (searchBody.children.length > 0) {
                        showResults(searchBody);
                        // Recursively call if there are still results
                        await search(e, currentOffset + 100);
                    }
                } else {
                    alert('Molimo unesite ime izdavača.');
                }
            }
            catch (error) {
                alert(error.message);
            }
        }


        searchButton.addEventListener('click', search);
        publisher.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                search(e);
            }
        });
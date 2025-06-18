const searchButton = document.getElementById('search');
        let publisher = document.getElementById('publisher');
        const results = document.getElementById('results');
        const mainText = document.querySelector('.main-text');
        const DomParser = new DOMParser();
        const searchErrorMessage = 'Došlo je do greške prilikom pretrage. Molimo pokušajte ponovo kasnije.'
        const textForMain = `Unesi izdavaca i saznaj sta izlazi ${new Date().getFullYear()} godine :)`;
        const corsProxy = 'https://api.codetabs.com/v1/proxy?quest=';
        mainText.textContent = textForMain;

        // To avoid Cors proxy issues with URI encoding, we normalize the publisher name.
        const normalizePublisherName = (publisherName) => {
            try{
                publisherName = publisherName.replace(/\s+/g, '+');
                publisherName = publisherName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐžŽćĆčČšŠ]/g, c => {
                    const map = { 'đ': 'd', 'Đ': 'D', 'ž': 'z', 'Ž': 'Z', 'ć': 'c', 'Ć': 'C', 'č': 'c', 'Č': 'C', 'š': 's', 'Š': 'S' };
                    return map[c] || c;
                });

                return publisherName;
            } catch (error) {
                throw new Error(searchErrorMessage);
            }
        }

        const searchForData = async (publisherName, offset) => {
            try {
                const publisher = normalizePublisherName(publisherName);
                const targetUrl = `https://plus.cobiss.net/cobiss/sr/sr/bib/search/advanced?ax&ti&pu=${publisher}&db=cobib&mat=allmaterials&max=100&pdfrom=01.01.2025&start=${offset}`;
                const searchData = await fetch(corsProxy + encodeURIComponent(targetUrl));
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
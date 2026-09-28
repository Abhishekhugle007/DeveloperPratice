const app = document.querySelector('#app');
        const message = document.querySelector('#message');
        const fromSelect = document.querySelector('#from-currency');
        const toSelect = document.querySelector('#to-currency');
        const amountInput = document.querySelector('#amount');
        const state = { rates: null, rate: null };
        const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' });
        const formatter = (currency) => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 });

        function nameOf(code) {
            try { return currencyNames.of(code) || code; }
            catch { return code; }
        }

        function rateBetween(from, to) {
            if (from === to) return 1;
            const rates = state.rates.rates;
            const fromRate = from === state.rates.base ? 1 : rates[from];
            const toRate = to === state.rates.base ? 1 : rates[to];
            return fromRate && toRate ? toRate / fromRate : null;
        }

        function renderConversion() {
            if (!state.rates) return;
            const from = fromSelect.value;
            const to = toSelect.value;
            const rate = rateBetween(from, to);
            const amount = Number(amountInput.value);
            state.rate = rate;
            document.querySelector('#from-name').textContent = nameOf(from);
            document.querySelector('#to-name').textContent = nameOf(to);
            document.querySelector('#snapshot-base').textContent = `1 ${from}`;

            if (rate === null || !Number.isFinite(amount) || amount < 0) {
                document.querySelector('#converted').textContent = '--';
                document.querySelector('#rate-line').textContent = 'This currency pair is unavailable';
                return;
            }

            const convertedAmount = amount * rate;
            document.querySelector('#converted').textContent = formatter(to).format(convertedAmount);
            document.querySelector('#rate-line').textContent = `1 ${from} = ${new Intl.NumberFormat('en-US', { maximumSignificantDigits: 7 }).format(rate)} ${to}`;
            renderSnapshot(from);
        }

        function renderSnapshot(base) {
            const preferred = ['EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD', 'CHF', 'CNY'];
            const currencies = preferred.filter((code) => code !== base && state.rates.rates[code]).slice(0, 5);
            document.querySelector('#snapshot-list').innerHTML = currencies.map((code) => {
                const rate = rateBetween(base, code);
                return `<div class="snapshot-row"><span class="snapshot-currency"><span class="snapshot-code">${code}</span><span class="snapshot-name">${nameOf(code)}</span></span><span class="snapshot-value">${new Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 }).format(rate)}</span></div>`;
            }).join('');
        }

        function populateCurrencies(data) {
            const currencies = [data.base, ...Object.keys(data.rates)].sort();
            for (const select of [fromSelect, toSelect]) {
                select.innerHTML = currencies.map((code) => `<option value="${code}">${code} · ${nameOf(code)}</option>`).join('');
            }
            fromSelect.value = data.base;
            toSelect.value = data.rates.INR ? 'INR' : currencies.find((code) => code !== data.base);
        }

        async function loadRates() {
            app.classList.add('loading');
            try {
                const response = await fetch('/api/rates/USD');
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Exchange rates are unavailable.');
                state.rates = data;
                populateCurrencies(data);
                const date = new Date(`${data.date}T12:00:00`);
                document.querySelector('#updated-date').textContent = `RATE DATE · ${new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(date).toUpperCase()}`;
                document.querySelector('#rate-date').textContent = `Reference rate · ${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)}`;
                renderConversion();
            } catch (error) {
                message.textContent = error.message || 'Could not load exchange rates. Check your connection and try again.';
                document.querySelector('#updated-date').textContent = 'RATES UNAVAILABLE';
            } finally {
                app.classList.remove('loading');
                app.setAttribute('aria-busy', 'false');
            }
        }

        amountInput.addEventListener('input', renderConversion);
        fromSelect.addEventListener('change', renderConversion);
        toSelect.addEventListener('change', renderConversion);
        document.querySelector('#converter-form').addEventListener('submit', (event) => event.preventDefault());
        document.querySelector('#swap-button').addEventListener('click', () => {
            const previousFrom = fromSelect.value;
            fromSelect.value = toSelect.value;
            toSelect.value = previousFrom;
            renderConversion();
        });
        document.querySelector('#copy-button').addEventListener('click', async () => {
            const converted = document.querySelector('#converted').textContent;
            if (converted === '--') return;
            try {
                await navigator.clipboard.writeText(converted);
                message.textContent = `Copied ${converted}`;
                setTimeout(() => { message.textContent = ''; }, 1800);
            } catch {
                message.textContent = 'Clipboard access is unavailable in this browser.';
            }
        });

        loadRates();

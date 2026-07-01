const { useState } = React;
const {
  buildForecast,
  convertToLivingCurrency,
  formatMoney,
  formatFxRate,
  CalcError,
} = CalcEngine;

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'JPY'];

const DEFAULT_FORM = {
  pay_cycle: 'biweekly',
  pay_rate_type: 'salary',
  rate_value: '75000',
  hours_per_period: '40',
  tax_rate: '22',
  pay_currency: 'USD',
  living_currency: 'EUR',
  fx_rate: '0.92',
  forecast_start: '2026-01-01',
  forecast_end: '2026-12-31',
};

function rateLabel(payRateType) {
  if (payRateType === 'hourly') return 'Hourly rate';
  if (payRateType === 'salary') return 'Annual salary';
  return 'Project amount';
}

function validateForm(form) {
  const required = [
    'pay_cycle',
    'pay_rate_type',
    'rate_value',
    'tax_rate',
    'pay_currency',
    'living_currency',
    'fx_rate',
    'forecast_start',
    'forecast_end',
  ];

  for (const field of required) {
    if (form[field] === '' || form[field] == null) {
      return field.replace(/_/g, ' ') + ' is required';
    }
  }

  if (form.pay_rate_type === 'hourly') {
    if (form.hours_per_period === '' || form.hours_per_period == null) {
      return 'hours per period is required for hourly pay';
    }
  }

  const numericFields = ['rate_value', 'tax_rate', 'fx_rate'];
  if (form.pay_rate_type === 'hourly') numericFields.push('hours_per_period');

  for (const field of numericFields) {
    const val = form[field];
    if (isNaN(Number(val))) return field.replace(/_/g, ' ') + ' must be a number';
    if (Number(val) < 0) return field.replace(/_/g, ' ') + ' must be non-negative';
  }

  const taxRate = Number(form.tax_rate);
  if (taxRate > 100) return 'tax rate must be between 0 and 100 (percentage)';

  if (form.pay_rate_type === 'project' && form.pay_cycle !== 'onetime') {
    return 'Project pay rate type requires a one-time pay cycle';
  }

  if (form.forecast_end < form.forecast_start) {
    return 'forecast end must be on or after forecast start';
  }

  return null;
}

function ForecastApp() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      setResult(null);
      return;
    }

    try {
      const events = buildForecast({
        payCycle: form.pay_cycle,
        payRateType: form.pay_rate_type,
        rateValue: form.rate_value,
        hoursPerPeriod: form.hours_per_period,
        taxRatePercent: form.tax_rate,
        fxRate: form.fx_rate,
        forecastStart: form.forecast_start,
        forecastEnd: form.forecast_end,
      });

      const fxRate = form.fx_rate;
      const rows = events.map((ev) => {
        const netLiving = convertToLivingCurrency(ev.net, fxRate);
        const cumulativeLiving = convertToLivingCurrency(ev.cumulativeNet, fxRate);
        const taxWithheld = ev.gross.minus(ev.net);
        return {
          date: ev.date,
          gross: ev.gross,
          taxWithheld,
          net: ev.net,
          netLiving,
          cumulativeNet: ev.cumulativeNet,
          cumulativeLiving,
        };
      });

      const last = rows[rows.length - 1];
      setError(null);
      setResult({
        rows,
        totalNet: last ? last.cumulativeNet : null,
        totalNetLiving: last ? last.cumulativeLiving : null,
        taxRate: form.tax_rate,
        fxRate: form.fx_rate,
        payCurrency: form.pay_currency,
        livingCurrency: form.living_currency,
      });
    } catch (err) {
      const message = err instanceof CalcError ? err.message : 'An unexpected error occurred';
      setError(message);
      setResult(null);
    }
  }

  return (
    <div>
      <h1>Net Pay Forecaster</h1>
      <p className="subtitle">
        Project predicted net income over a date range, with currency conversion.
      </p>

      <div className="layout">
        <section className="card">
          <h2>Income parameters</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Pay cycle
              <select name="pay_cycle" value={form.pay_cycle} onChange={handleChange}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
                <option value="onetime">One-time</option>
              </select>
            </label>

            <label>
              Pay rate type
              <select name="pay_rate_type" value={form.pay_rate_type} onChange={handleChange}>
                <option value="hourly">Hourly</option>
                <option value="salary">Salary</option>
                <option value="project">Project</option>
              </select>
            </label>

            <label>
              {rateLabel(form.pay_rate_type)} ({form.pay_currency})
              <input
                type="number"
                name="rate_value"
                value={form.rate_value}
                onChange={handleChange}
                min="0"
                step="any"
              />
            </label>

            {form.pay_rate_type === 'hourly' && (
              <label>
                Hours per period
                <input
                  type="number"
                  name="hours_per_period"
                  value={form.hours_per_period}
                  onChange={handleChange}
                  min="0"
                  step="any"
                />
              </label>
            )}

            <label>
              Tax rate (%)
              <span className="hint">Enter as a percentage, e.g. 22 for 22%</span>
              <input
                type="number"
                name="tax_rate"
                value={form.tax_rate}
                onChange={handleChange}
                min="0"
                max="100"
                step="any"
              />
            </label>

            <label>
              Pay currency
              <select name="pay_currency" value={form.pay_currency} onChange={handleChange}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label>
              Living currency
              <select name="living_currency" value={form.living_currency} onChange={handleChange}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label>
              FX rate
              <span className="hint">
                1 {form.pay_currency} = fx_rate {form.living_currency}
              </span>
              <input
                type="number"
                name="fx_rate"
                value={form.fx_rate}
                onChange={handleChange}
                min="0"
                step="any"
              />
            </label>

            <label>
              Forecast start
              <input
                type="date"
                name="forecast_start"
                value={form.forecast_start}
                onChange={handleChange}
              />
            </label>

            <label>
              Forecast end
              <input
                type="date"
                name="forecast_end"
                value={form.forecast_end}
                onChange={handleChange}
              />
            </label>

            <div className="actions">
              <button type="submit">Generate forecast</button>
            </div>

            {error && <div className="error-banner" role="alert">{error}</div>}
          </form>
        </section>

        <section className="card">
          <h2>Forecast output</h2>
          {!result ? (
            <p className="empty-state">Enter parameters and generate a forecast to see results.</p>
          ) : (
            <>
              <div className="assumptions">
                <div><strong>Assumptions used:</strong></div>
                <div>Tax rate: {result.taxRate}% (user-entered flat rate, not verified)</div>
                <div>
                  FX rate: 1 {result.payCurrency} = {formatFxRate(result.fxRate)} {result.livingCurrency}{' '}
                  (user-entered static rate, not live market data)
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Gross ({result.payCurrency})</th>
                      <th>Tax ({result.payCurrency})</th>
                      <th>Net ({result.payCurrency})</th>
                      <th>Net ({result.livingCurrency})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row) => (
                      <tr key={row.date}>
                        <td>{row.date}</td>
                        <td>{formatMoney(row.gross)}</td>
                        <td>{formatMoney(row.taxWithheld)}</td>
                        <td>{formatMoney(row.net)}</td>
                        <td>{formatMoney(row.netLiving)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Cumulative total</td>
                      <td colSpan="2"></td>
                      <td>{formatMoney(result.totalNet)}</td>
                      <td>{formatMoney(result.totalNetLiving)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ForecastApp />);

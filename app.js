const { useState, createElement: e, Fragment } = React;
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

const PAY_CYCLE_OPTIONS = [
  ['weekly', 'Weekly'],
  ['biweekly', 'Biweekly'],
  ['monthly', 'Monthly'],
  ['annually', 'Annually'],
  ['onetime', 'One-time'],
];

const PAY_RATE_OPTIONS = [
  ['hourly', 'Hourly'],
  ['salary', 'Salary'],
  ['project', 'Project'],
];

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

function SelectField({ label, name, value, onChange, options }) {
  return e(
    'label',
    null,
    label,
    e(
      'select',
      { name, value, onChange },
      options.map(([val, text]) => e('option', { key: val, value: val }, text))
    )
  );
}

function NumberField(props) {
  const { label, hint, name, value, onChange, min, max, step } = props;
  return e(
    'label',
    null,
    label,
    hint ? e('span', { className: 'hint' }, hint) : null,
    e('input', {
      type: 'number',
      name,
      value,
      onChange,
      min,
      max,
      step,
    })
  );
}

function ForecastOutput({ result }) {
  if (!result) {
    return e(
      'p',
      { className: 'empty-state' },
      'Enter parameters and generate a forecast to see results.'
    );
  }

  return e(
    Fragment,
    null,
    e(
      'div',
      { className: 'assumptions' },
      e('div', null, e('strong', null, 'Assumptions used:')),
      e('div', null, 'Tax rate: ' + result.taxRate + '% (user-entered flat rate, not verified)'),
      e(
        'div',
        null,
        'FX rate: 1 ' +
          result.payCurrency +
          ' = ' +
          formatFxRate(result.fxRate) +
          ' ' +
          result.livingCurrency +
          ' (user-entered static rate, not live market data)'
      )
    ),
    e(
      'div',
      { style: { overflowX: 'auto' } },
      e(
        'table',
        null,
        e(
          'thead',
          null,
          e(
            'tr',
            null,
            e('th', null, 'Date'),
            e('th', null, 'Gross (' + result.payCurrency + ')'),
            e('th', null, 'Tax (' + result.payCurrency + ')'),
            e('th', null, 'Net (' + result.payCurrency + ')'),
            e('th', null, 'Net (' + result.livingCurrency + ')')
          )
        ),
        e(
          'tbody',
          null,
          result.rows.map((row) =>
            e(
              'tr',
              { key: row.date },
              e('td', null, row.date),
              e('td', null, formatMoney(row.gross)),
              e('td', null, formatMoney(row.taxWithheld)),
              e('td', null, formatMoney(row.net)),
              e('td', null, formatMoney(row.netLiving))
            )
          )
        ),
        e(
          'tfoot',
          null,
          e(
            'tr',
            null,
            e('td', null, 'Cumulative total'),
            e('td', { colSpan: 2 }),
            e('td', null, formatMoney(result.totalNet)),
            e('td', null, formatMoney(result.totalNetLiving))
          )
        )
      )
    )
  );
}

function ForecastApp() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
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

  return e(
    'div',
    null,
    e('h1', null, 'Net Pay Forecaster'),
    e(
      'p',
      { className: 'subtitle' },
      'Project predicted net income over a date range, with currency conversion.'
    ),
    e(
      'div',
      { className: 'layout' },
      e(
        'section',
        { className: 'card' },
        e('h2', null, 'Income parameters'),
        e(
          'form',
          { className: 'form-grid', onSubmit: handleSubmit },
          SelectField({
            label: 'Pay cycle',
            name: 'pay_cycle',
            value: form.pay_cycle,
            onChange: handleChange,
            options: PAY_CYCLE_OPTIONS,
          }),
          SelectField({
            label: 'Pay rate type',
            name: 'pay_rate_type',
            value: form.pay_rate_type,
            onChange: handleChange,
            options: PAY_RATE_OPTIONS,
          }),
          e(
            'label',
            null,
            rateLabel(form.pay_rate_type) + ' (' + form.pay_currency + ')',
            e('input', {
              type: 'number',
              name: 'rate_value',
              value: form.rate_value,
              onChange: handleChange,
              min: '0',
              step: 'any',
            })
          ),
          form.pay_rate_type === 'hourly'
            ? NumberField({
                label: 'Hours per period',
                name: 'hours_per_period',
                value: form.hours_per_period,
                onChange: handleChange,
                min: '0',
                step: 'any',
              })
            : null,
          NumberField({
            label: 'Tax rate (%)',
            hint: 'Enter as a percentage, e.g. 22 for 22%',
            name: 'tax_rate',
            value: form.tax_rate,
            onChange: handleChange,
            min: '0',
            max: '100',
            step: 'any',
          }),
          SelectField({
            label: 'Pay currency',
            name: 'pay_currency',
            value: form.pay_currency,
            onChange: handleChange,
            options: CURRENCIES.map((c) => [c, c]),
          }),
          SelectField({
            label: 'Living currency',
            name: 'living_currency',
            value: form.living_currency,
            onChange: handleChange,
            options: CURRENCIES.map((c) => [c, c]),
          }),
          NumberField({
            label: 'FX rate',
            hint: '1 ' + form.pay_currency + ' = fx_rate ' + form.living_currency,
            name: 'fx_rate',
            value: form.fx_rate,
            onChange: handleChange,
            min: '0',
            step: 'any',
          }),
          e(
            'label',
            null,
            'Forecast start',
            e('input', {
              type: 'date',
              name: 'forecast_start',
              value: form.forecast_start,
              onChange: handleChange,
            })
          ),
          e(
            'label',
            null,
            'Forecast end',
            e('input', {
              type: 'date',
              name: 'forecast_end',
              value: form.forecast_end,
              onChange: handleChange,
            })
          ),
          e(
            'div',
            { className: 'actions' },
            e('button', { type: 'submit' }, 'Generate forecast')
          ),
          error ? e('div', { className: 'error-banner', role: 'alert' }, error) : null
        )
      ),
      e(
        'section',
        { className: 'card' },
        e('h2', null, 'Forecast output'),
        e(ForecastOutput, { result })
      )
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(e(ForecastApp));

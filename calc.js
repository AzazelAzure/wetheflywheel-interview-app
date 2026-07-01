/**
 * Pure calculation engine for net-pay forecasting.
 * All money arithmetic uses Decimal — no native float math on currency values.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    var Decimal = require('./vendor/decimal.min.js');
    module.exports = factory(Decimal);
  } else {
    root.CalcEngine = factory(root.Decimal);
  }
})(typeof self !== 'undefined' ? self : this, function (Decimal) {
  'use strict';

  var PAY_CYCLES = ['weekly', 'biweekly', 'monthly', 'annually', 'onetime'];
  var PAY_RATE_TYPES = ['hourly', 'salary', 'project'];
  var ROUND_MODE = Decimal.ROUND_HALF_UP;

  function CalcError(message) {
    this.name = 'CalcError';
    this.message = message;
  }
  CalcError.prototype = Error.prototype;

  function toDecimal(value, fieldName) {
    if (value instanceof Decimal) return value;
    if (value === null || value === undefined || value === '') {
      throw new CalcError((fieldName || 'Value') + ' is required');
    }
    try {
      var d = new Decimal(value);
      if (!d.isFinite()) throw new CalcError((fieldName || 'Value') + ' must be a finite number');
      return d;
    } catch (e) {
      throw new CalcError((fieldName || 'Value') + ' must be a valid number');
    }
  }

  function parseDate(isoDate) {
    if (!isoDate || typeof isoDate !== 'string') {
      throw new CalcError('Date must be an ISO date string (YYYY-MM-DD)');
    }
    var parts = isoDate.split('-');
    if (parts.length !== 3) throw new CalcError('Invalid date: ' + isoDate);
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10) - 1;
    var d = parseInt(parts[2], 10);
    var date = new Date(y, m, d);
    if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) {
      throw new CalcError('Invalid date: ' + isoDate);
    }
    return date;
  }

  function formatDateISO(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function addDays(date, days) {
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function addMonths(date, months) {
    var d = new Date(date.getTime());
    var day = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() !== day) {
      d.setDate(0);
    }
    return d;
  }

  function addYears(date, years) {
    var d = new Date(date.getTime());
    var month = d.getMonth();
    var day = d.getDate();
    d.setFullYear(d.getFullYear() + years);
    if (d.getMonth() !== month || d.getDate() !== day) {
      d.setDate(0);
    }
    return d;
  }

  function periodsPerYear(payCycle) {
    if (PAY_CYCLES.indexOf(payCycle) === -1) {
      throw new CalcError('Unsupported pay cycle: ' + payCycle);
    }
    var map = { weekly: 52, biweekly: 26, monthly: 12, annually: 1, onetime: 1 };
    return map[payCycle];
  }

  function computeGross(params) {
    var payRateType = params.payRateType;
    var payCycle = params.payCycle;
    var rateValue = toDecimal(params.rateValue, 'rate_value');

    if (rateValue.lt(0)) throw new CalcError('rate_value must be non-negative');
    if (PAY_RATE_TYPES.indexOf(payRateType) === -1) {
      throw new CalcError('Unsupported pay rate type: ' + payRateType);
    }
    if (PAY_CYCLES.indexOf(payCycle) === -1) {
      throw new CalcError('Unsupported pay cycle: ' + payCycle);
    }

    if (payRateType === 'project') {
      if (payCycle !== 'onetime') {
        throw new CalcError('project pay rate type requires pay_cycle onetime');
      }
      return rateValue;
    }

    if (payRateType === 'hourly') {
      if (params.hoursPerPeriod === null || params.hoursPerPeriod === undefined || params.hoursPerPeriod === '') {
        throw new CalcError('hours_per_period is required for hourly pay rate type');
      }
      var hours = toDecimal(params.hoursPerPeriod, 'hours_per_period');
      if (hours.lt(0)) throw new CalcError('hours_per_period must be non-negative');
      return rateValue.times(hours);
    }

    if (payRateType === 'salary') {
      var periods = periodsPerYear(payCycle);
      return rateValue.div(periods);
    }

    throw new CalcError('Unsupported pay rate type: ' + payRateType);
  }

  function computeNet(gross, taxRatePercent) {
    var grossDec = toDecimal(gross, 'gross');
    var taxPct = toDecimal(taxRatePercent, 'tax_rate');
    if (taxPct.lt(0) || taxPct.gt(100)) {
      throw new CalcError('tax_rate must be between 0 and 100 (percentage)');
    }
    var taxFraction = taxPct.div(100);
    return grossDec.times(new Decimal(1).minus(taxFraction));
  }

  function generatePayDates(params) {
    var payCycle = params.payCycle;
    var start = parseDate(params.forecastStart);
    var end = parseDate(params.forecastEnd);

    if (end < start) {
      throw new CalcError('forecast_end must be on or after forecast_start');
    }
    if (PAY_CYCLES.indexOf(payCycle) === -1) {
      throw new CalcError('Unsupported pay cycle: ' + payCycle);
    }

    if (payCycle === 'onetime') {
      return [formatDateISO(start)];
    }

    var dates = [];
    var current = new Date(start.getTime());
    var intervalDays = payCycle === 'weekly' ? 7 : payCycle === 'biweekly' ? 14 : null;

    while (current <= end) {
      dates.push(formatDateISO(current));
      if (intervalDays !== null) {
        current = addDays(current, intervalDays);
      } else if (payCycle === 'monthly') {
        current = addMonths(current, 1);
      } else if (payCycle === 'annually') {
        current = addYears(current, 1);
      }
    }

    return dates;
  }

  function convertToLivingCurrency(amount, fxRate) {
    return toDecimal(amount, 'amount').times(toDecimal(fxRate, 'fx_rate'));
  }

  function buildForecast(params) {
    var payCycle = params.payCycle;
    var payRateType = params.payRateType;
    var rateValue = params.rateValue;
    var hoursPerPeriod = params.hoursPerPeriod;
    var taxRatePercent = params.taxRatePercent;
    var fxRate = params.fxRate;
    var forecastStart = params.forecastStart;
    var forecastEnd = params.forecastEnd;

    var fxDec = toDecimal(fxRate, 'fx_rate');
    if (fxDec.lt(0)) {
      throw new CalcError('fx_rate must be non-negative');
    }

    var dates = generatePayDates({ payCycle: payCycle, forecastStart: forecastStart, forecastEnd: forecastEnd });
    var cumulativeNet = new Decimal(0);
    var events = [];

    for (var i = 0; i < dates.length; i++) {
      var gross = computeGross({
        payRateType: payRateType,
        rateValue: rateValue,
        hoursPerPeriod: hoursPerPeriod,
        payCycle: payCycle,
      });
      var net = computeNet(gross, taxRatePercent);
      cumulativeNet = cumulativeNet.plus(net);
      events.push({
        date: dates[i],
        gross: gross,
        net: net,
        cumulativeNet: cumulativeNet,
      });
    }

    return events;
  }

  function formatMoney(decimalValue) {
    return toDecimal(decimalValue).toDecimalPlaces(2, ROUND_MODE).toFixed(2);
  }

  function formatFxRate(decimalValue) {
    return toDecimal(decimalValue).toDecimalPlaces(6, ROUND_MODE).toFixed(6);
  }

  return {
    CalcError: CalcError,
    PAY_CYCLES: PAY_CYCLES,
    PAY_RATE_TYPES: PAY_RATE_TYPES,
    periodsPerYear: periodsPerYear,
    computeGross: computeGross,
    computeNet: computeNet,
    generatePayDates: generatePayDates,
    buildForecast: buildForecast,
    convertToLivingCurrency: convertToLivingCurrency,
    formatMoney: formatMoney,
    formatFxRate: formatFxRate,
  };
});

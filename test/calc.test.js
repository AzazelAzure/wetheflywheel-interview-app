const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  periodsPerYear,
  computeGross,
  computeNet,
  generatePayDates,
  buildForecast,
  convertToLivingCurrency,
  CalcError,
} = require('../calc.js');
const Decimal = require('../vendor/decimal.min.js');

const RANGE = { forecastStart: '2026-01-01', forecastEnd: '2026-06-30' };

describe('pay cycle period counts', () => {
  test('weekly, biweekly, monthly, annually, onetime over multi-month range', () => {
    assert.equal(generatePayDates({ payCycle: 'weekly', ...RANGE }).length, 26);
    assert.equal(generatePayDates({ payCycle: 'biweekly', ...RANGE }).length, 13);
    assert.equal(generatePayDates({ payCycle: 'monthly', ...RANGE }).length, 6);
    assert.equal(generatePayDates({ payCycle: 'annually', ...RANGE }).length, 1);
    assert.equal(generatePayDates({ payCycle: 'onetime', ...RANGE }).length, 1);
  });
});

describe('gross by pay rate type', () => {
  test('hourly: rate × hours including fractional hours', () => {
    const gross = computeGross({
      payRateType: 'hourly',
      rateValue: '25.50',
      hoursPerPeriod: '7.25',
      payCycle: 'weekly',
    });
    assert.equal(gross.toString(), '184.875');
  });

  test('salary: annual salary divided by periods per year', () => {
    const weekly = computeGross({
      payRateType: 'salary',
      rateValue: '52000',
      payCycle: 'weekly',
    });
    assert.equal(weekly.toString(), '1000');

    const monthly = computeGross({
      payRateType: 'salary',
      rateValue: '60000',
      payCycle: 'monthly',
    });
    assert.equal(monthly.toString(), '5000');
  });

  test('project: flat amount; rejects non-onetime cycle', () => {
    const gross = computeGross({
      payRateType: 'project',
      rateValue: '15000',
      payCycle: 'onetime',
    });
    assert.equal(gross.toString(), '15000');

    assert.throws(
      () =>
        computeGross({
          payRateType: 'project',
          rateValue: '15000',
          payCycle: 'weekly',
        }),
      CalcError
    );
  });
});

describe('tax application', () => {
  test('net <= gross for positive tax; 0% returns gross; percentage not fraction', () => {
    const gross = new Decimal('1000');
    const net22 = computeNet(gross, '22');
    assert.equal(net22.toString(), '780');
    assert.ok(net22.lte(gross));

    const net0 = computeNet(gross, '0');
    assert.equal(net0.toString(), gross.toString());

    // 22 treated as fraction would yield negative net
    const wrongNet = gross.times(new Decimal(1).minus(22));
    assert.ok(net22.gt(0));
    assert.ok(wrongNet.lt(0));
  });
});

describe('currency conversion', () => {
  test('linear per-event conversion; fx=1 noop; spot-check 0.92', () => {
    const amount = new Decimal('100');
    assert.equal(convertToLivingCurrency(amount, '1').toString(), '100');
    assert.equal(convertToLivingCurrency(amount, '0.92').toString(), '92');
  });
});

describe('decimal precision / no float drift', () => {
  test('52 weekly additions of 0.1-scale net pay stays exact to the cent', () => {
    const events = buildForecast({
      payCycle: 'weekly',
      payRateType: 'hourly',
      rateValue: '10',
      hoursPerPeriod: '4',
      taxRatePercent: '10',
      fxRate: '1',
      forecastStart: '2026-01-01',
      forecastEnd: '2026-12-31',
    });
    assert.equal(events.length, 53);
    const perNet = new Decimal('36'); // 40 gross * 0.9
    const expectedTotal = perNet.times(53);
    assert.equal(events[52].cumulativeNet.toString(), expectedTotal.toString());
    assert.equal(events[52].cumulativeNet.toFixed(2), '1908.00');
  });
});

describe('invalid input handling', () => {
  test('negative rate, missing hours, bad enum produce CalcError', () => {
    assert.throws(
      () =>
        computeGross({
          payRateType: 'hourly',
          rateValue: '-5',
          hoursPerPeriod: '40',
          payCycle: 'weekly',
        }),
      CalcError
    );

    assert.throws(
      () =>
        computeGross({
          payRateType: 'hourly',
          rateValue: '25',
          payCycle: 'weekly',
        }),
      CalcError
    );

    assert.throws(() => periodsPerYear('fortnightly'), CalcError);
    assert.throws(
      () =>
        generatePayDates({
          payCycle: 'weekly',
          forecastStart: '2026-06-30',
          forecastEnd: '2026-01-01',
        }),
      CalcError
    );
  });
});

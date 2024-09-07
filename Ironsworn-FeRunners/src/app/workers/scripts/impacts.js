// Impacts update Momentum MAX and RESET.

const impactsAttrs = [
  'impactWounded',
  'impactShaken',
  'impactUnregulated',
  'impactPermanentlyHarmed',
  'impactTraumatized',
  'impactDoomed',
  'impactTormented',
  'impactIndebted',
  'impactOverheated',
  'impactInfected',
  'impactOther1',
  'impactOther2'
]

const rigImpactAttrs = [
  'impactRigOverheated',
  'impactRigInfected'
]

const momentumAttrs = [
  'momentum_max',
  'momentum_reset',
  'jacked_in_check_rig_button'
]

function buildImpactEvents (impacts) {
  return impacts.map(impact => `change:${impact}`).join(' ')
}

on(`${buildImpactEvents(impactsAttrs)} ${buildImpactEvents(rigImpactAttrs)} change:jacked_in_check_rig_button`,
  function() {
    var numImpacts = 0;
    getAttrs(
      impactsAttrs.concat(momentumAttrs).concat(rigImpactAttrs),
      function(values) {
        for (var attr in impactsAttrs) {
          if (values[impactsAttrs[attr]] === 'on') {
            numImpacts += 1;
          }
        }
        for (var attr in rigImpactAttrs) {
          if (values[rigImpactAttrs[attr]] === 'on' && values['jacked_in_check_rig_button'] === 'on') {
            numImpacts += 1;
          }
        }
        const momentumReset = function() {
          if (numImpacts === 0) return 2;
          if (numImpacts === 1) return 1;
          if (numImpacts > 1) return 0;
        }
        setAttrs({
          momentum_max: 10 - numImpacts,
          momentum_reset: momentumReset()    
        });
      }
    );
  }
);

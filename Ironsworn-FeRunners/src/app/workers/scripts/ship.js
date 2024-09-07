on('change:rig-modules_button change:rig-support-vehicles_button change:rig-crew_button change:rig-impacts_button', function(eventinfo) {
  const type = eventinfo.sourceAttribute.match(/(.*?)_button/)[1]
  setAttrs({
    [`${type}`]: eventinfo.newValue
  });
});
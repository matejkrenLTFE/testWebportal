const objectList = {
    get: [
        {classId: 8, instanceId: "0.0.1.0.0.255", attributeId: 2, description: "Clock", descCode:"CLOCK_JOB"},
        {classId: 7, instanceId: "0.0.98.1.0.255", attributeId: 2, description: "Data of billing period 1", descCode:"DATA_BILL_PERIOD"},
        {classId: 7, instanceId: "1.0.99.1.0.255", attributeId: 2, description: "Load profile with period 1", descCode:"LOAD_PROFILE_PERIOD_1"},
        {classId: 7, instanceId: "1.0.99.2.0.255", attributeId: 2, description: "Load profile with period 2", descCode:"LOAD_PROFILE_PERIOD_2"},
        {classId: 7, instanceId: "1.0.99.14.0.255", attributeId: 2, description: "Power quality profile", descCode:"POWER_Q"},
        {classId: 7, instanceId: "0.0.99.98.0.255", attributeId: 2, description: "Standard Event Log", descCode:"STANDARD_EVENT_LOG"},
        {classId: 7, instanceId: "0.0.99.98.1.255", attributeId: 2, description: "Fraud Detection Log", descCode:"FRAUD_DET_LOG"},
        {classId: 7, instanceId: "0.0.99.98.2.255", attributeId: 2, description: "Disconnector Control  Log", descCode:"DISC_CONTROL_LOG"},
        {classId: 7, instanceId: "0.0.99.98.3.255", attributeId: 2, description: "M-Bus Event Log", descCode:"M_BUS_EVT_LOG"},
        {classId: 7, instanceId: "0.0.99.98.4.255", attributeId: 2, description: "Power Quality Log", descCode:"POWER_LOG"},
        {classId: 7, instanceId: "0.0.99.98.5.255", attributeId: 2, description: "Communication event log", descCode:"COMM_LOG"},
        {classId: 7, instanceId: "0.0.99.98.7.255", attributeId: 2, description: "Security event log", descCode:"SEC_EVT_LOG"},
        {classId: 7, instanceId: "1.0.99.97.0.255", attributeId: 2, description: "Power failure event log", descCode:"POW_FAIL_LOG"},
        {classId: 3, instanceId: "1.0.1.8.0.255", attributeId: 2, description: "Active energy import (+A)", descCode:"ENERGY_IMP"},
        {classId: 3, instanceId: "1.0.2.8.0.255", attributeId: 2, description: "Active energy export (−A)", descCode:"ENERGY_EXP"},
        {classId: 3, instanceId: "1.0.32.7.0.255", attributeId: 2, description: "Instantaneous voltage L1", descCode:"VOLT_L1"},
        {classId: 3, instanceId: "1.0.52.7.0.255", attributeId: 2, description: "Instantaneous voltage L2", descCode:"VOLT_L2"},
        {classId: 3, instanceId: "1.0.72.7.0.255", attributeId: 2, description: "Instantaneous voltage L3", descCode:"VOLT_L3"},
        {classId: 3, instanceId: "1.0.31.7.0.255", attributeId: 2, description: "Instantaneous current L1", descCode:"CURR_L1"},
        {classId: 3, instanceId: "1.0.51.7.0.255", attributeId: 2, description: "Instantaneous current L2", descCode:"CURR_L2"},
        {classId: 3, instanceId: "1.0.71.7.0.255", attributeId: 2, description: "Instantaneous current L3", descCode:"CURR_L3"}
    ],
    timeSync: [
        {classId: 8, instanceId: "0.0.1.0.0.255", attributeId: 2, description: "Clock", descCode:"CLOCK_JOB"}
    ],
    upgrade: [
        {classId: 18, instanceId: "0.0.44.0.0.255", attributeId: 0, description: "Upgrade"}
    ]
};
module.exports = objectList;
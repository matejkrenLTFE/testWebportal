const eventList = {
    "events": [
        {
            "id": "1",
            "enumeration": "EVT_PLC_NODE_JOINED_INDICATION",
            "name": "PLC network join indication",
            "description": "New device has successfully completed the association procedure, and is now part of the PLC network",
            "severity": "Info"
        },
        {
            "id": "2",
            "enumeration": "EVT_PLC_NODE_ROUTE_DISCOVERED",
            "name": "PLC route discovered",
            "description": "New device has successfully completed the association procedure, and is now part of the PLC network",
            "severity": "Info"
        },
        {
            "id": "3",
            "enumeration": "EVT_PLC_NODE_LEAVE_INDICATION",
            "name": "PLC network leave indication",
            "description": "Attached device has been successfully unregistered from the PLC network due to its request to leave",
            "severity": "Info"
        },
        {
            "id": "4",
            "enumeration": "EVT_PLC_NODE_LEAVE_CONFORMATION",
            "name": "PLC network leave conformation",
            "description": "Attached device has been successfully unregistered from the PLC network due to a request from the PAN coordinator to leave",
            "severity": "Info"
        },
        {
            "id": "5",
            "enumeration": "EVT_PLC_NETWORK_CFM",
            "name": "PLC modem initialization",
            "description": "PLC modem was initialized after reset/restart",
            "severity": "Info"
        },
        {
            "id": "6",
            "enumeration": "EVT_PLC_NODE_JOIN_DECLINED",
            "name": "PLC network join declined",
            "description": "Request to join the PLC network was declined",
            "severity": "Info"
        },
        {
            "id": "7",
            "enumeration": "EVT_PLC_NODE_ROUTE_ERROR",
            "name": "PLC route error",
            "description": "The route towards the intended destination is not established",
            "severity": "Info"
        },
        {
            "id": "200",
            "enumeration": "EVT_RS485_S650_ALARM",
            "name": "S650 Alarm",
            "description": "Alarm received from meter S650",
            "severity": "Info"
        },
        {
            "id": "300",
            "enumeration": "EVT_PLC_METER_JOINED",
            "name": "PLC device joined",
            "description": "New device is ready for communication after joining to the PLC network",
            "severity": "Info"
        },
        {
            "id": "301",
            "enumeration": "EVT_PLC_METER_REMOVED",
            "name": "PLC device removed",
            "description": "Attached Device has been unregistered from the PLC network due to its request, request from PAN coordinator or expiration of No-communication timeout",
            "severity": "Info"
        },
        {
            "id": "500",
            "enumeration": "EVT_SYS_POWER_FAIL",
            "name": "Power cut",
            "description": "Short break in power supply which are related to the device or the network",
            "severity": "Warning"
        },
        {
            "id": "501",
            "enumeration": "EVT_SYS_POWER_RETURN",
            "name": "Power up",
            "description": "The device is powered (at least one phase is connected)",
            "severity": "Info"
        },
        {
            "id": "502",
            "enumeration": "EVT_SYS_POWER_BACKUP_LOW",
            "name": "Backup power low",
            "description": "Backup power supply for system backup is low",
            "severity": "Warning"
        },
        {
            "id": "503",
            "enumeration": "EVT_SYS_POWER_BACKUP_EMPTY",
            "name": "Backup power empty",
            "description": "Backup power supply for system backup is empty",
            "severity": "Warning"
        },
        {
            "id": "504",
            "enumeration": "EVT_SYS_REBOOT",
            "name": "System reboot requested",
            "description": "Device received a reboot request from application/web services",
            "severity": "Info"
        },
        {
            "id": "505",
            "enumeration": "EVT_SYS_RESTART",
            "name": "System rebooted",
            "description": "Device was rebooted with reboot cause",
            "severity": "Info"
        },
        {
            "id": "506",
            "enumeration": "EVT_SYS_TIME_SET",
            "name": "Clock sync on-demand",
            "description": "The clock has been adjusted",
            "severity": "Info"
        },
        {
            "id": "507",
            "enumeration": "EVT_SYS_TIME_SYNCHRONISED",
            "name": "Clock sync NTP",
            "description": "The clock was successfully synchronized with NTP server",
            "severity": "Info"
        },
        {
            "id": "508",
            "enumeration": "EVT_SYS_NTP_ERROR",
            "name": "Clock sync NTP failed",
            "description": "Failure during clock synchronization with NTP server",
            "severity": "Error"
        },
        {
            "id": "509",
            "enumeration": "EVT_SYS_MAIN_COVER_OPENED",
            "name": "Main cover opened",
            "description": "Main cover has been opened",
            "severity": "Info"
        },
        {
            "id": "510",
            "enumeration": "EVT_SYS_MAIN_COVER_CLOSED",
            "name": "Main cover closed",
            "description": "Main cover has been closed",
            "severity": "Info"
        },
        {
            "id": "511",
            "enumeration": "EVT_SYS_TERMINAL_COVER_OPENED",
            "name": "Device cover opened",
            "description": "Device cover has been opened",
            "severity": "Info"
        },
        {
            "id": "512",
            "enumeration": "EVT_SYS_TERMINAL_COVER_CLOSED",
            "name": "Device cover closed",
            "description": "Device cover has been closed",
            "severity": "Info"
        },
        {
            "id": "513",
            "enumeration": "EVT_SYS_FW_INTERNAL_ERROR",
            "name": "FW error",
            "description": "Firmware/application internal error",
            "severity": "Error"
        },
        {
            "id": "514",
            "enumeration": "EVT_SYS_CPU_OVERLOADED",
            "name": "CPU overloaded",
            "description": "CPU overloaded",
            "severity": "Warning"
        },
        {
            "id": "515",
            "enumeration": "EVT_SYS_VOL_MEM_LOW_LEVEL",
            "name": "RAM memory low",
            "description": "Volatile memory (RAM) low level",
            "severity": "Warning"
        },
        {
            "id": "516",
            "enumeration": "EVT_SYS_NOVOL_MEM_LOW_LEVEL",
            "name": "NV system memory low",
            "description": "Non-volatile memory (FLASH - system partition) low level",
            "severity": "Warning"
        },
        {
            "id": "517",
            "enumeration": "EVT_SYS_DATA_MEM_LOW_LEVEL",
            "name": "NV data memory low",
            "description": "Non-volatile memory (FLASH - data partition) low level",
            "severity": "Warning"
        },
        {
            "id": "518",
            "enumeration": "EVT_SYS_RESET_KEY_PRESSED",
            "name": "Reset button pressed",
            "description": "Reset button has been pressed",
            "severity": "Info"
        },
        {
            "id": "519",
            "enumeration": "EVT_SYS_PHASE_L1_OUTAGE",
            "name": "Power down phase L1",
            "description": "Power loss / power disconnected on phase L1",
            "severity": "Info"
        },
        {
            "id": "520",
            "enumeration": "EVT_SYS_PHASE_L2_OUTAGE",
            "name": "Power down phase L2",
            "description": "Power loss / power disconnected on phase L2",
            "severity": "Info"
        },
        {
            "id": "521",
            "enumeration": "EVT_SYS_PHASE_L3_OUTAGE",
            "name": "Power down phase L3",
            "description": "Power loss / power disconnected on phase L3",
            "severity": "Info"
        },
        {
            "id": "522",
            "enumeration": "EVT_SYS_PHASE_L1_RETURN",
            "name": "Power up phase L1",
            "description": "Power connected to phase L1",
            "severity": "Info"
        },
        {
            "id": "523",
            "enumeration": "EVT_SYS_PHASE_L2_RETURN",
            "name": "Power up phase L2",
            "description": "Power connected to phase L2",
            "severity": "Info"
        },
        {
            "id": "524",
            "enumeration": "EVT_SYS_PHASE_L3_RETURN",
            "name": "Power up phase L3",
            "description": "Power connected to phase L3",
            "severity": "Info"
        },
        {
            "id": "525",
            "enumeration": "EVT_SYS_FULL_POWER_OUTAGE",
            "name": "Power down",
            "description": "A complete power outage of the device that lasts more than 3 seconds (of all 3 phases)",
            "severity": "Warning"
        },
        {
            "id": "526",
            "enumeration": "EVT_SYS_BATTERY_DISCHARGED",
            "name": "Battery empty",
            "description": "The battery (for RTC backup) has been drained",
            "severity": "Warning"
        },
        {
            "id": "527",
            "enumeration": "EVT_SYS_BATTERY_LOW_LEVEL",
            "name": "Battery low",
            "description": "Battery power for RTC backup is low",
            "severity": "Warning"
        },
        {
            "id": "528",
            "enumeration": "EVT_SYS_BOOT_PARTITION_SWITCH",
            "name": "System boot partition switch",
            "description": "Device has been booted from the backup boot partition",
            "severity": "Warning"
        },
        {
            "id": "600",
            "enumeration": "EVT_WAN_WAN1_CONNECT",
            "name": "WAN1 connected",
            "description": "Cellular modem is ready for communication after it was successfully registered  to the network, PDP context was established and parameters were set (WAN1)",
            "severity": "Info"
        },
        {
            "id": "601",
            "enumeration": "EVT_WAN_WAN1_DISCONNECT",
            "name": "WAN1 disconnected",
            "description": "Cellular modem was disconnected from the network (WAN1)",
            "severity": "Info"
        },
        {
            "id": "602",
            "enumeration": "EVT_WAN_WAN1_CONNECT_FAIL",
            "name": "WAN1 connect failed",
            "description": "Cellular modem failed to connect to the network (WAN1)",
            "severity": "Info"
        },
        {
            "id": "603",
            "enumeration": "EVT_WAN_WAN1_PING_FAIL",
            "name": "WAN1 ping failed",
            "description": "PING request (connection test) failed to reach the destination (WAN1)",
            "severity": "Info"
        },
        {
            "id": "604",
            "enumeration": "EVT_WAN_WAN2_CONNECT",
            "name": "WAN2 connected",
            "description": "Ethernet interface was connected (WAN2)",
            "severity": "Info"
        },
        {
            "id": "605",
            "enumeration": "EVT_WAN_WAN2_DISCONNECT",
            "name": "WAN2 disconnected",
            "description": "Ethernet interface was disconnected due to lost of Ethernet physical link or the interface was disabled (WAN2)",
            "severity": "Info"
        },
        {
            "id": "606",
            "enumeration": "EVT_WAN_WAN1_SIGNAL_LOW",
            "name": "WAN1 signal low",
            "description": "Cellular Signal quality too low, not known, or not detected (WAN1)",
            "severity": "Warning"
        },
        {
            "id": "607",
            "enumeration": "EVT_WAN_WAN1_SIGNAL_RESTORED",
            "name": "WAN1 signal restored",
            "description": "Cellular signal quality restored  (WAN1)",
            "severity": "Info"
        },
        {
            "id": "608",
            "enumeration": "EVT_WAN_WAN2_CARRIER_UP",
            "name": "WAN2 ETH link up",
            "description": "Ethernet cable was connected and a physical link connection was established (WAN2)",
            "severity": "Info"
        },
        {
            "id": "609",
            "enumeration": "EVT_WAN_WAN2_CARRIER_DOWN",
            "name": "WAN2 ETH link down",
            "description": "Ethernet Physical link connection is not established (WAN2)",
            "severity": "Warning"
        },
        {
            "id": "610",
            "enumeration": "EVT_WAN_LAN_CARRIER_UP",
            "name": "Local ETH link up",
            "description": "Ethernet cable is connected and a physical link connection was established (LOCAL)",
            "severity": "Info"
        },
        {
            "id": "611",
            "enumeration": "EVT_WAN_LAN_CARRIER_DOWN",
            "name": "Local ETH link down",
            "description": "Ethernet Physical link connection is not established (LOCAL)",
            "severity": "Info"
        },
        {
            "id": "612",
            "enumeration": "EVT_WAN_WAN1_MODEM_NOT_DETECTED",
            "name": "Communication module not detected",
            "description": "Communication module is not detected or not inserted correctly (FEM1T)",
            "severity": "Info"
        },
        {
            "id": "613",
            "enumeration": "EVT_WAN_WAN1_MODEM_SIM_ERROR",
            "name": "SIM card error",
            "description": "SIM card is not detected, not inserted correctly or PIN is incorrect",
            "severity": "Error"
        },
        {
            "id": "614",
            "enumeration": "EVT_WAN_WAN1_MODEM_DETECTED",
            "name": "Communication module detected",
            "description": "Communication module was inserted  (FEM1T)",
            "severity": "Info"
        },
        {
            "id": "615",
            "enumeration": "EVT_WAN_WAN1_CMUX_ERROR",
            "name": "CMUX error",
            "description": "Cellular modem didn't respond to CMUX command/setup request or CMUX virtual serial ports are not correctly opened. Due to this error, the system is set to operate without CMUX",
            "severity": "Error"
        },
        {
            "id": "616",
            "enumeration": "EVT_WAN_WAN1_MODEM_FW_UPGRADE_OK",
            "name": "WAN1 modem FW upgrade succeeded",
            "description": "Cellular modem firmware was successfully upgraded (WAN1)",
            "severity": "Info"
        },
        {
            "id": "617",
            "enumeration": "EVT_WAN_WAN1_MODEM_FW_UPGRADE_ERROR",
            "name": "WAN1 modem FW upgrade failed",
            "description": "Cellular modem firmware upgrade failed (WAN1)",
            "severity": "Error"
        },
        {
            "id": "618",
            "enumeration": "EVT_WAN_WAN1_MODEM_SIM_OK",
            "name": "SIM card OK",
            "description": "SIM card is ready/capable of entering PIN",
            "severity": "Info"
        },
        {
            "id": "619",
            "enumeration": "EVT_WAN_WAN1_MODEM_HW_RESET",
            "name": "WAN1 modem HW reset",
            "description": "Cellular modem hardware reset occurred",
            "severity": "Error"
        },
        {
            "id": "620",
            "enumeration": "EVT_WAN_WAN1_MODEM_SW_RESET",
            "name": "WAN1 modem SW reset",
            "description": "Cellular modem hardware reset occurred",
            "severity": "Warning"
        },
        {
            "id": "621",
            "enumeration": "EVT_WAN_WAN1_MODEM_GSM_REGISTRATION_FAILURE",
            "name": "GSM registration failure",
            "description": "Cellular modem failed to register to the GSM network",
            "severity": "Error"
        },
        {
            "id": "622",
            "enumeration": "EVT_WAN_WAN1_MODEM_GPRS_REGISTRATION_FAILURE",
            "name": "GPRS registration failure",
            "description": "Cellular modem failed to register to the GPRS network",
            "severity": "Error"
        },
        {
            "id": "623",
            "enumeration": "EVT_WAN_WAN1_CELL_ID_CHANGE",
            "name": "CELL ID changed",
            "description": "CELL ID of the cellular network was changed",
            "severity": "Error"
        },
        {
            "id": "700",
            "enumeration": "EVT_CNTR_UPGRADE_STARTED",
            "name": "FW upgrade started",
            "description": "Firmware upgrade started",
            "severity": "Info"
        },
        {
            "id": "701",
            "enumeration": "EVT_CNTR_UPGRADE_SUCCEEDED",
            "name": "FW upgrade succeeded",
            "description": "The firmware was successfully upgraded",
            "severity": "Info"
        },
        {
            "id": "702",
            "enumeration": "EVT_CNTR_UPGRADE_FAILED",
            "name": "FW upgrade failed",
            "description": "Firmware upgrade failed",
            "severity": "Error"
        },
        {
            "id": "703",
            "enumeration": "EVT_CNTR_PARAMETERS_SET",
            "name": "Parameter set",
            "description": "Parameter was configured",
            "severity": "Info"
        },
        {
            "id": "704",
            "enumeration": "EVT_CNTR_UPGRADE_STATUS",
            "name": "FW upgrade status",
            "description": "Firmware upgrade progress status",
            "severity": "Info"
        },
        {
            "id": "705",
            "enumeration": "EVT_CNTR_UPGRADE_ROLLBACK",
            "name": "FW rollback",
            "description": "The firmware was rolled back to the previous version",
            "severity": "Warning"
        },
        {
            "id": "706",
            "enumeration": "EVT_CNTR_UPGRADE_IMAGE_SIGNATURE",
            "name": "FW signature invalid",
            "description": "An invalid Firmware image signature was detected",
            "severity": "Info"
        },
        {
            "id": "707",
            "enumeration": "EVT_CNTR_UPGRADE_CANCELLED",
            "name": "FW upgrade cancelled",
            "description": "FW upgrade was cancelled due to cancellation request",
            "severity": "Info"
        },
        {
            "id": "800",
            "enumeration": "EVT_MAC_METER_COMMISSIONED",
            "name": "Meter commissioned",
            "description": "Meter commissioned",
            "severity": "Info"
        },
        {
            "id": "801",
            "enumeration": "EVT_MAC_METER_NO_KEYS",
            "name": "Meter no keys",
            "description": "Meter security material are not available",
            "severity": "Info"
        },
        {
            "id": "802",
            "enumeration": "EVT_MAC_METER_WRONG_KEYS",
            "name": "Meter wrong keys",
            "description": "Meter security material is not correct",
            "severity": "Info"
        },
        {
            "id": "803",
            "enumeration": "EVT_MAC_METER_LOST",
            "name": "Meter lost",
            "description": "Meter lost because there of unsuccessful communication for certain time period",
            "severity": "Info"
        },
        {
            "id": "804",
            "enumeration": "EVT_MAC_METER_REMOVED",
            "name": "Meter removed",
            "description": "Meter removed from attached devices table",
            "severity": "Info"
        },
        {
            "id": "805",
            "enumeration": "EVT_MAC_METER_UPGRADE_STARTED",
            "name": "Meter upgrade started",
            "description": "Meter upgrade started",
            "severity": "Info"
        },
        {
            "id": "806",
            "enumeration": "EVT_MAC_METER_UPGRADE_COMPLETED",
            "name": "Meter upgrade completed",
            "description": "Meter upgrade completed",
            "severity": "Info"
        },
        {
            "id": "807",
            "enumeration": "EVT_MAC_METER_TIME_SYNC_FAILED",
            "name": "Meter clock sync failed",
            "description": "Meter clock synchronization failed",
            "severity": "Info"
        },
        {
            "id": "901",
            "enumeration": "EVT_DATA_RESOURCE_CREATED",
            "name": "Job added",
            "description": "Job added successfully",
            "severity": "Info"
        },
        {
            "id": "902",
            "enumeration": "EVT_DATA_RESOURCE_CHANGED",
            "name": "Job parameters changed",
            "description": "Job parameter(s) changed",
            "severity": "Info"
        },
        {
            "id": "903",
            "enumeration": "EVT_DATA_RESOURCE_DELETED",
            "name": "Job deleted",
            "description": "Job deleted successfully",
            "severity": "Info"
        },
        {
            "id": "904",
            "enumeration": "EVT_DATA_RESOURCE_DELETION_FAILED",
            "name": "Job delete failed",
            "description": "Job delete failed",
            "severity": "Info"
        },
        {
            "id": "905",
            "enumeration": "EVT_SCHEDULE_RESOURCE_STARTED",
            "name": "Job started (Scheduled)",
            "description": "Scheduled job started",
            "severity": "Info"
        },
        {
            "id": "906",
            "enumeration": "EVT_ONDEMAND_RESOURCE_ACTIVATED",
            "name": "Job started (on-demand)",
            "description": "On-demand job started",
            "severity": "Info"
        },
        {
            "id": "907",
            "enumeration": "EVT_RESOURCE_ITERATION_OK",
            "name": "Job iteration succeeded",
            "description": "Iteration completed successfully",
            "severity": "Info"
        },
        {
            "id": "908",
            "enumeration": "EVT_RESOURCE_ITERATION_NOT_COMPLETED",
            "name": "Job iteration partly succeeded",
            "description": "Iteration partly succeeded",
            "severity": "Info"
        },
        {
            "id": "909",
            "enumeration": "EVT_RESOURCE_ITERATION_FAILED",
            "name": "Job iteration failed",
            "description": "Iteration failed",
            "severity": "Info"
        },
        {
            "id": "910",
            "enumeration": "EVT_RESOURCE_ITERATION_EMPTY",
            "name": "Job iteration empty",
            "description": "Iteration empty, no meters active in job",
            "severity": "Info"
        },
        {
            "id": "911",
            "enumeration": "EVT_RESOURCE_ITERATION_STOPPED",
            "name": "Job iteration stopped",
            "description": "Iteration stopped, duration expired",
            "severity": "Info"
        },
        {
            "id": "912",
            "enumeration": "EVT_SEND_DATA_RESOURCE",
            "name": "Job data request",
            "description": "Request for data was received",
            "severity": "Info"
        },
        {
            "id": "913",
            "enumeration": "EVT_CONFIG_RESOURCE_CHANGED",
            "name": "Job device list changed",
            "description": "Job device list changed",
            "severity": "Info"
        },
        {
            "id": "914",
            "enumeration": "EVT_UPGRADE_FIRMWARE_FAILED",
            "name": "Job FW upgrade failed",
            "description": "Job meter upgrade failed to start because of wrong parameters, upgrade file NOK or anther upgrade job is already in progress",
            "severity": "Info"
        },
        {
            "id": "1000",
            "enumeration": "EVT_SEC_WEB_LOGIN_OK",
            "name": "Web-UI login ok",
            "description": "Login to Web User Interface succeeded",
            "severity": "Info"
        },
        {
            "id": "1001",
            "enumeration": "EVT_SEC_WEB_LOGIN_CERT_MISMATCH",
            "name": "Web-UI login failed, cert mismatch",
            "description": "Login to Web User Interface failed due to certificate mismatch error",
            "severity": "Info"
        },
        {
            "id": "1002",
            "enumeration": "EVT_SEC_WEB_LOGIN_PASS_MISMATCH",
            "name": "Web-UI login failed, wrong pwd",
            "description": "Login to Web User Interface failed due to incorrect password",
            "severity": "Info"
        },
        {
            "id": "1100",
            "enumeration": "EVT_SD_DATABASE_FULL",
            "name": "Database full",
            "description": "The database has reached the predefined size constraint",
            "severity": "Error"
        },
        {
            "id": "1101",
            "enumeration": "EVT_SD_DATABASE_ERROR",
            "name": "Database error",
            "description": "The database detect an error and it has to be reinitialized",
            "severity": "Error"
        },
        {
            "id": "1102",
            "enumeration": "EVT_SD_DATABASE_REINIT",
            "name": "Database re-initialized",
            "description": "The database was reinitialized",
            "severity": "Info"
        }
    ]
};
module.exports = eventList;
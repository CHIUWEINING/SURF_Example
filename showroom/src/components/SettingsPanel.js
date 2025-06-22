import React, { useState, useEffect } from 'react';
import { Drawer, TextField, Select, Input, InputLabel, FormControl, IconButton, Button, Tooltip, MenuItem, ButtonGroup } from '@mui/material'; 
import InputAdornment from '@mui/material/InputAdornment';
import { Add, Remove } from '@mui/icons-material';
import Autocomplete from '@mui/material/Autocomplete'; // Import Autocomplete

function SettingsPanel({ onUpdateSettings, selectedYear, setSelectedYear, companies, handleResetGraph, setResetSettings }) {
  const [settings, setSettings] = useState([{ main_company: companies[0], topK: 10 }]);

  const handleAdd = () => {
    if (settings.length < 3) {
      setSettings([...settings, { main_company: companies[0], topK: 10 }]);
    }
  };
  const handleRemove = (index) => {
    if (settings.length > 1) {
      setSettings(settings.filter((_, i) => i !== index));
    }
  };

  const handleSettingChange = (index, field, value) => {
    const newSettings = settings.map((setting, i) => {
      if (i === index) {
        return { ...setting, [field]: value };
      }
      return setting;
    });
    setSettings(newSettings);
  };

  const handleSubmit = () => {
    onUpdateSettings(settings);
  };
  // Updated handleRemoveAll function to reset settings
  const handleReset = () => {
    setSettings([{ main_company: companies[0], topK: 10 }]); // Reset settings to keep only the first one
    handleResetGraph(); // Call the function to reset the graph
  };

  useEffect(() => {
    if (setResetSettings) {
      setResetSettings(() => () => setSettings([{ main_company: companies[0], topK: 10 }]));
    }
  }, [setResetSettings]);
  return (
    <Drawer variant="permanent" anchor="left">
      <div style={{ padding: 20, width: '15vw' }}>
        {/* <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>SURF</h1>
          <a 
            href="https://www.youtube.com/watch?v=HobCyNgR9T0" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ fontSize: '11px', color: '#09BC8A', textDecoration: 'underline', whiteSpace: 'nowrap' }}
          >
            Tutorial Video
          </a>
        </div> */}
        {/* Updated Year selection with buttons */}
        <ButtonGroup fullWidth variant="contained" aria-label="outlined primary button group">
          {[2023, 2022, 2021].map((yearOption) => (
            <Button
              key={yearOption}
              onClick={() => setSelectedYear(yearOption)}
              style={{ flex: 1, background: selectedYear === yearOption ? '#09BC8A' : '#F5F5F5', color:'black', borderWidth: '1px', borderColor:'black' }}
            >
              {yearOption}
            </Button>
          ))}
        </ButtonGroup>
        <hr/>
        {settings.map((setting, index) => (
          <div key={index}>
            <FormControl fullWidth margin="normal">
              <InputLabel></InputLabel>
              <Autocomplete
                value={setting.main_company}
                onChange={(e, newValue) => handleSettingChange(index, 'main_company', newValue)}
                options={companies}
                renderInput={(params) => <TextField {...params} label="Company" variant="outlined" />}
              />
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel htmlFor="top-k-relations">Top-K</InputLabel>
              <Input
                id="top-k-relations"
                type="number"
                value={setting.topK}
                onChange={(e) => {
                  if (e.target.value>=50){
                    handleSettingChange(index, 'topK', 50)
                  }else if(e.target.value <=0){
                    handleSettingChange(index, 'topK', 0)
                  }else handleSettingChange(index,'topK', e.target.value)
                }
                }
                startAdornment={
                  <InputAdornment position="start">
                    <IconButton onClick={() => handleSettingChange(index, 'topK', Math.max(setting.topK - 1, 1))}>
                      <Remove />
                    </IconButton>
                  </InputAdornment>
                }
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton onClick={() => handleSettingChange(index, 'topK', Math.min(setting.topK+1, 50))}>
                      <Add />
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>

            {settings.length > 1 && (
              <Tooltip title="Remove the setting" arrow>
                <Button variant="contained" onClick={() => handleRemove(index)} style={{ marginTop: '20px', background: '#09BC8A' }}>
                  Remove
                </Button>
              </Tooltip>
            )}

            {settings.length > 1 && <hr />}
          </div>
        ))}

        {settings.length < 3 && (
          <Tooltip title="Click to add a new company and its related settings." arrow>
            <Button variant="contained" fullWidth onClick={handleAdd} style={{ marginTop: '0px', background: '#09BC8A' }}>
              Add New Company
            </Button>
          </Tooltip>) }
        {settings.length < 3 && <hr/>}
        <Tooltip title="Remove all the companies and settings" arrow>
          <Button variant="contained" fullWidth onClick={handleReset} style={{ marginTop: '20px', background: '#09BC8A' }}>
            Reset
          </Button>
        </Tooltip>
        <Tooltip title="Submit your settings to update the graph." arrow>
          <Button variant="contained" fullWidth onClick={handleSubmit} style={{ marginTop: '20px', background: '#09BC8A' }}>
            Submit
          </Button>
        </Tooltip>
      </div>
    </Drawer>
  );
}

export default SettingsPanel;

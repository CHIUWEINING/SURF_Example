import React, { useState, useEffect } from 'react';
import SettingsPanel from './components/SettingsPanel';
import NetworkGraph from './components/NetworkGraph';
import RelationInfoPanel from './components/RelationInfoPanel';
function App() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [nodesData, setNodesData] = useState([]);
  const [highlightedNodes, setHighlightedNodes] = useState([]);
  const [highlightedEdges, setHighlightedEdges] = useState([]);
  const [mainNodes, setMainNodes] = useState([]); // Multiple main nodes
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [selectedYear, setSelectedYear] = useState(2023); // Initialize with 2021 as default
  const [resetSettingsInPanel, setResetSettingsInPanel] = useState(null); // To hold the reset function

  useEffect(() => {
    fetch(`https://localhost/api/relations?year=${selectedYear}`)
      .then((response) => response.json())
      .then((data) => {
        setGraphData(data);
      })
      .catch((error) => console.error('Error fetching relations:', error));
  }, []);
  useEffect(() => {
    fetch('https://localhost/api/nodesData') // Adjust this URL if necessary
      .then(response => response.json())
      .then(data => {
        setNodesData(data); // Update the state with the fetched tickers
      })
      .catch(error => console.error('Error fetching tickers:', error));
  }, []);

  const handleSettingsChange = (settingsList) => {
    const promises = settingsList.map(({ main_company, topK, threshold }) => {
      let lastMatch;
      if  (main_company==="All Companies"){
         lastMatch = "All Companies";
      }else{
        let ticker = [...main_company.matchAll(/\(([^)]+)\)/g)];
        lastMatch = ticker.length > 0 ? ticker[ticker.length - 1][1] : null;
      }
      return fetch(`https://localhost/api/filter-relations?main_company=${lastMatch}&topK=${topK}&relationStrength=strongest&threshold=0&year=${selectedYear}`)
              .then((response) => response.json());
  });

    Promise.all(promises)
      .then((dataList) => {
        const combinedData = dataList.reduce(
          (acc, data) => {
            // Use a Set to keep track of node IDs that have been added
            const existingNodeIds = new Set(acc.nodes.map((node) => node.id));

            // Add nodes, but only if they haven't been added before
            data.nodes.forEach((node) => {
              if (!existingNodeIds.has(node.id)) {
                acc.nodes.push(node);
                existingNodeIds.add(node.id); // Track the newly added node's ID
              }
            });

            const existingLinks = new Set(acc.links.map(link => `${link.source}-${link.target}`));

            data.links.forEach(link => {
              const linkKey = `${link.source}-${link.target}`;
              if (!existingLinks.has(linkKey)) {
                acc.links.push(link);
                existingLinks.add(linkKey); // Track the link as added
              }
            });
            return acc;
          },
          { nodes: [], links: [] }
        );
        setGraphData(combinedData);
        setMainNodes(settingsList.map((setting) => ({ id: setting.main_company })));
        setHighlightedNodes(combinedData.nodes);
        setHighlightedEdges(combinedData.links);
        let nextMainNodes = settingsList.map((setting) => ({ id: setting.main_company }));
        if (nextMainNodes.length === 2) {
          // Find the edge between the two main companies, if it exists
          const mainCompany1 = nextMainNodes[0].id;
          const mainCompany2 = nextMainNodes[1].id;
        
          const foundEdge = combinedData.links.find(
            (link) => 
              (link.source === mainCompany1 && link.target === mainCompany2) || 
              (link.source === mainCompany2 && link.target === mainCompany1)
          );
        
          if (foundEdge) {
            // foundEdge.source = {id:foundEdge.source}
            // foundEdge.target = {id:foundEdge.target}
            setSelectedEdge(foundEdge); // Set the found edge as the selected edge
          } else {
            setSelectedEdge(null); // No edge between the two companies, set to null
          }
        } else {
          setSelectedEdge(null); // If less or more than 2 companies, set selectedEdge to null
        }
      })
      .catch((error) => console.error('Error fetching filtered relations:', error));
  };
  const handleResetGraph = () => {
    fetch('https://localhost/api/relations')
      .then((response) => response.json())
      .then((data) => {
        setGraphData(data); // Reset graph data to initial view
        setMainNodes([{ id: 'All Companies' }]); // Reset main nodes to global
        setHighlightedNodes([]);
        setHighlightedEdges([]);
        setSelectedEdge(null);
      })
      .catch((error) => console.error('Error fetching relations:', error));
  };
  // Existing code for fetching data...

  const handleYearChange = (year) => {
    setSelectedYear(year);
    handleResetGraph()
    resetSettingsInPanel(); // Reset the settings in SettingsPanel
  };
  return (
    <div>
      <SettingsPanel
        onUpdateSettings={handleSettingsChange}
        selectedYear={selectedYear} // Pass the selected year to SettingsPanel
        setSelectedYear={handleYearChange}
        companies={['All Companies', ...nodesData]}
        handleResetGraph={handleResetGraph}  // Pass handleRemoveAll to SettingsPanel
        setResetSettings = {setResetSettingsInPanel}
      />
      <NetworkGraph
        data={graphData}
        highlightedNodes={highlightedNodes}
        highlightedEdges={highlightedEdges}
        mainNodes={mainNodes} // Multiple main nodes
        selectedEdge={selectedEdge}
        onEdgeClick={(link) => {
          setSelectedEdge(link);
        }
        }
      />
      <RelationInfoPanel 
        edge={selectedEdge}
      />
    </div>
  );
}

export default App;

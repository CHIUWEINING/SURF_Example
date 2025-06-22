import React, { useEffect, useRef, useState } from 'react';
import { withSize } from 'react-sizeme';
import ForceGraph3D from 'react-force-graph-3d';
// import * as THREE from 'three';  // Import Three.js


const withSizeHOC = withSize({ monitorWidth: true, monitorHeight: false, noPlaceholder: true });

function NetworkGraph({ data, highlightedNodes, highlightedEdges, mainNodes, selectedEdge, onEdgeClick }) {
  const fgRef = useRef();
  const [graphWidth, setGraphWidth] = useState(window.innerWidth * 0.75);
  const [sectorList, setSectorList] = useState(['Selected Companies','Communication Services', 'Materials', 'Real Estate', 'Consumer Staples', 'Industrials', 'Information Technology', 'Energy', 'Consumer Discretionary', 'Utilities', 'Financials', 'Health Care']);
  const [sectorColorMap, setSectorColorMap] = useState({'Selected Companies':'#7E7E7E', 'Communication Services': '#F94144', 'Materials': '#F3722C', 'Real Estate':'#F8961E', 'Consumer Staples': '#F9844A', 'Industrials': '#F9C74F', 'Information Technology': '#90BE6D', 'Energy':'#43AA8B', 'Consumer Discretionary':'#4D908E', 'Utilities':'#577590', 'Financials':'#277DA1', 'Health Care':'#219EBC'});

  useEffect(() => {
    const handleResize = () => {
      setGraphWidth(window.innerWidth * 0.75);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (fgRef.current) {
      // Set the initial camera position closer (adjust z for zoom)
      fgRef.current.cameraPosition({ x: 0, y: 0, z: 450 }, { x: 0, y: 0, z: 0 }, 3000);
    }
  }, [fgRef]);
  const getNodeColor = (node) => {
    // If node is one of the main company nodes
    if (mainNodes.some((mainNode) => node.id.includes(mainNode.id))) {
      return '#7E7E7E'; // Dark Gray for main nodes
    }
  
    // Use sectorColorMap for node color
    const sector = node.sector; // Assuming you have a 'sector' property in the node data
    return sectorColorMap[sector] || 'gray'; // Default to gray if sector not found
  };

  const getLinkColor = (link) => {
    if (selectedEdge && 
      ((selectedEdge.source === link.source && selectedEdge.target === link.target) ||
      (selectedEdge.source === link.target && selectedEdge.target === link.source))) {
      return '#FF0400';
    }
    for (let edge of highlightedEdges) {
      if (edge.source.id === link.source.id && edge.target.id === link.target.id) {
        return '#6b9080'; // Highlighted edge color
      }
    }
    return '#F0E7D8'; // Default edge color
  };
  // Split sectors into groups of 3, last group can have less than 3
  const splitSectors = () => {
    const sectorGroups = [];
    for (let i = 0; i < sectorList.length; i += 6) {
      sectorGroups.push(sectorList.slice(i, i + 6));
    }
    return sectorGroups;
  };

  // Function to determine node size based on capacity (cap)
  const getNodeSize = (node) => {
    const normalizedCap = node.cap || 0.5; // Use the 'cap' feature, default to 0.5 if missing
    const minSize = 3;  // Minimum node size
    const maxSize = 13; // Maximum node size
    return minSize + normalizedCap * (maxSize - minSize); // Scale the size
  };
  // Render solid nodes for mainNodes, default for others
  // const renderNode = (node) => {
  //   if (mainNodes.some((mainNode) => node.id.includes(mainNode.id))) {
  //     const color = getNodeColor(node);
  //     const geometry = new THREE.SphereGeometry(getNodeSize(node));
  //     const material = new THREE.MeshStandardMaterial({ color, opacity: 1, transparent: false });
  //     const mesh = new THREE.Mesh(geometry, material);
  //     mesh.position.z += 50; // Adjust this value to bring the node closer
  //     // Set render order and disable depth test for mainNodes to ensure they're always on top
  //     mesh.renderOrder = 100; // High render order to ensure it's on top
  //     // mesh.material.depthTest = false; // Ensure no transparency or occlusion

  //     return mesh;
  //   }
  //   return null
  // };

  return (
    <div style={{ position: 'relative' }}>
      {/* Graph */}
      <ForceGraph3D
        ref={fgRef}
        width={graphWidth}
        graphData={data}
        nodeAutoColorBy={null}
        nodeColor={getNodeColor}
        linkColor={getLinkColor}
        linkWidth={(link) => link.value * 70}
        nodeLabel={(node) => `<div style="font-size: 16px; font-weight: bold; color: black; border-radius: 5px">${node.id} [${node.sector}]</div>`}
        onNodeClick={(node) => console.log(node)}
        onLinkClick={onEdgeClick}
        backgroundColor="white"
        // nodeThreeObject={renderNode}  // Custom node renderer
        nodeVal={getNodeSize} // Size determined by cap
      />

      {/* Instruction Block */}
      {/* <div style={styles.instructionBlock}>
        <p style={styles.instructionText}>
          <span style={{ display: 'block' }}>Left-click: rotate</span>
          <span style={{ display: 'block' }}>Mouse-wheel: zoom</span>
          <span style={{ display: 'block' }}>Right-click: pan</span>
        </p>
      </div> */}

      {/* Sector-Color Mapping Block */}
      <div style={styles.sectorBlock}>
        <div style={styles.sectorTitle}>Sector Colors</div>
        <div style={styles.sectorColumns}>
          {splitSectors().map((sectorGroup, groupIndex) => (
            <ul key={groupIndex} style={styles.sectorList}>
              {sectorGroup.map((sector, index) => (
                <li key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ backgroundColor: sectorColorMap[sector], width: '15px', height: '15px', display: 'inline-block', marginRight: '10px' }}></span>
                  <span style={{fontSize: '11px'}}>{sector}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
const styles = {
  instructionBlock: {
    position: 'absolute',
    bottom: '2px',
    left: '49%',
    width: '7%',
    // transform: 'translateX(-100%)', // Center horizontally
    backgroundColor: '#EDEDED',//'rgba(255, 255, 255, 0.8)', // Semi-transparent white background
    padding: '10px',
    borderRadius: '8px',
    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)',
    // border: '2px solid #40916C',
  },
  instructionText: {
    textAlign: 'justify',
    fontSize: '12px',
    color: '#5C5C5C',
    fontStyle: 'normal',
    fontWeight: 400,
    margin: 0,
  },
  sectorBlock: {
    position: 'absolute',
    top: '1%',
    left: '19%',
    backgroundColor: '#F5F5F5',
    padding: '10px',
    borderRadius: '8px',
    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)',
  },
  sectorTitle: {
    marginBottom: '10px',
    fontSize: '11px',
    color: '#5C5C5C',
    fontWeight: 'bold',
  },
  sectorColumns: {
    display: 'flex', // Display sector lists in columns
    gap: '10px',
  },
  sectorList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
  },
};

export default withSizeHOC(NetworkGraph);

import React, { useState, useRef, useEffect } from 'react';
import { Tooltip, Button, Modal, TextField, IconButton } from '@mui/material'; 
import { ThumbUp, ThumbDown } from '@mui/icons-material';
function getOrdinalSuffix(number) {
  const j = number % 10,
        k = number % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
}
function RelationInfoPanel({ edge }) {
  const [clickedParagraph, setClickedParagraph] = useState(null); // Track last clicked paragraph
  const [selectedParagraphs, setSelectedParagraphs] = useState([]); // Track selected related paragraphs
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showThankYou, setShowThankYou] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null); // Track user's feedback: 'positive' or 'negative'
  const handleFeedbackOpen = () => setFeedbackModalOpen(true);
  const handleFeedbackClose = () => setFeedbackModalOpen(false);

  const handleFeedbackSubmit = () => {
    setShowThankYou(true);
    setFeedback('');
    handleFeedbackClose();
    setTimeout(() => setShowThankYou(false), 5000); // Hide the thank-you message after 3 seconds
  };
  

  const handleFeedbackClick = (type) => {
    if (type!==selectedFeedback){
      setSelectedFeedback(type);
      setShowThankYou(true);
      setTimeout(() => setShowThankYou(false), 3000);
    }else{
      setSelectedFeedback(null);
    }
     // Optionally reset feedback after 3 seconds
  };
  const tmp = "<strong>Click on an edge in the graph to see relation details.</strong>";
  const containerRef = useRef(null); // Reference to the container
  let target_id;
  let source_id;
  // Scroll to top when the edge updates
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0; // Scroll to the top of the container
    }
    setSelectedFeedback(null);
  }, [edge]);
  if (!edge) {
    return (
      <div ref={containerRef} style={styles.container}>
        <h2>No Relation Selected</h2>
        <p dangerouslySetInnerHTML={{ __html: tmp }}/>
      </div>
    );
  }else{
    if (edge.target.id!==undefined)target_id = edge.target.id;
    else target_id = edge.target;
    if (edge.source.id!==undefined)source_id = edge.source.id;
    else source_id = edge.source;
  }
  // Parsing the keywords from the summary
  const [keywordsBlock, mainSummary] = edge.summary.split('\n\n');
  const keywords = keywordsBlock.replace('Keywords:', '').split(',').map((keyword) => keyword.trim());
  // Handle paragraph click
  const handleClick = (paragraph, firm) => {
    const relatedParagraphs = firm === 'firm1'
      ? edge.mutual_company1[paragraph] || []
      : edge.mutual_company2[paragraph] || [];

    if (clickedParagraph === paragraph) {
      // If clicked twice, reset color
      setSelectedParagraphs([]);
      setClickedParagraph(null);
    } else {
      // Set the clicked paragraph and related paragraphs
      setClickedParagraph(paragraph);
      setSelectedParagraphs([paragraph, ...relatedParagraphs]);
    }
  };

  // Function to calculate the marker's position in the spectrum
  const getMarkerPosition = (rank, totalRank) => {
    const percentage = (100-(rank / totalRank) * 100);
    return `${percentage-2}%`;
  };
  const totalRank = 63190; // Assuming this is the total number of ranks
  const rankMarkerPosition = getMarkerPosition(edge.ranking, totalRank);

  // Determine paragraph styles based on whether they are selected or clicked
  const getParagraphStyle = (paragraph) => {
    if (clickedParagraph === paragraph) {
      return { ...styles.paragraphBlock, backgroundColor: '#FFB3B3' }; // Yellow for clicked paragraph '#FFEB3B'
    } else if (selectedParagraphs.includes(paragraph)) {
      return { ...styles.paragraphBlock, backgroundColor: '#FFB3B3' }; // Red for related paragraphs
    } else {
      return styles.paragraphBlock; // Default color
    }
  };
  // Assign global numbers to each paragraph
  const firm1Paragraphs = Object.keys(edge.mutual_company1).map((paragraph, index) => ({
    paragraph,
    globalNumber: `L${index + 1}`,
  }));

  const firm2Paragraphs = Object.keys(edge.mutual_company2).map((paragraph, index) => ({
    paragraph,
    globalNumber: `R${index + 1}`,
  }));


// Get related paragraph numbers globally
const getRelatedNumbers = (paragraph, firm) => {
  const relatedParagraphs = firm === 'firm1'
    ? edge.mutual_company1[paragraph] || []
    : edge.mutual_company2[paragraph] || [];

  const relatedNumbers = firm === 'firm1'
    ? relatedParagraphs.map(relatedParagraph => {
        const relatedIndex = firm2Paragraphs.findIndex(p => p.paragraph === relatedParagraph);
        return relatedIndex >= 0 ? relatedIndex + 1 : null;
      }).filter(Boolean)
    : relatedParagraphs.map(relatedParagraph => {
        const relatedIndex = firm1Paragraphs.findIndex(p => p.paragraph === relatedParagraph);
        return relatedIndex >= 0 ? relatedIndex + 1 : null;
      }).filter(Boolean);

  // Sort the numbers and then append 'L' or 'R'
  const sortedRelatedNumbers = relatedNumbers.sort((a, b) => a - b).map(num => {
    return firm === 'firm1' ? `R${num}` : `L${num}`;
  });    
  return sortedRelatedNumbers.join(', ');
};


  const ranking = (1 - edge.ranking / 63190) * 100;
  const percentile = Math.floor(ranking); // Keep only the integer part
  const ordinalSuffix = getOrdinalSuffix(percentile);
  return (
    <div ref={containerRef} style={styles.container}>
      <h2>{source_id} and {target_id}</h2>

      {/* <div style={styles.detail}>
        <h3>Relation Score: {parseFloat(edge.value).toFixed(4)}</h3>
      </div> */}
      <div style={{...styles.detail, lineHeight: '1.8'}}>
        <div style={{...styles.rankRow, fontSize:"18px"}}>
        <strong>
            Relation score: {parseFloat(edge.value).toFixed(4)}{' '}
            (<span style={styles.percentile_number}>{percentile}</span>
            <sup style={styles.ordinal_suffix}>{ordinalSuffix}</sup> percentile)
          </strong>
          <Tooltip title={`We rank company relationships by their risk relationship scores. The higher the score is, the stronger the relationship is. The risk relation score between two firms is defined as the ratio of mutual risk paragraphs to the total number of paragraphs from both firms.`} arrow>
            <div style={styles.spectrumContainer}>
              <div style={styles.spectrum}>
                <span style={styles.spectrumLabelLeft}>0</span>
                {/* <span style={styles.spectrumLabelCenter}>Medium</span> */}
                <span style={styles.spectrumLabelRight}>100</span>
              </div>
              {/* Arrow marker */}
              <div style={{ ...styles.arrowMarker, left: rankMarkerPosition }} />
            </div>
          </Tooltip>
        </div>
      </div>


      <div style={styles.detail}>
        <h3>How are <em style={{fontWeight:'bold', fontSize: '20px' }}>{source_id}</em> and <em style={{fontWeight:'bold', fontSize: '20px' }}>{target_id}</em> related?</h3>
        {/* Keywords block */}
        <div style={styles.keywordsBlock}>
          {/* <strong>Keywords: </strong> */}
           
          <span style={styles.keywordsList}>
            {keywords.map((keyword, index) => (
              <span key={index} style={styles.keywordItem}>
                {keyword}
              </span>
            ))}
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'inline',
            }}
          >
            <p
              style={{
                ...styles.reason,
                display: 'inline',
                verticalAlign: 'top'
              }}
              dangerouslySetInnerHTML={{ __html: mainSummary.replace(/\n/g, '<br />') }}
            />
            <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: '-6px',  }}>
              <Tooltip
                title="Provide positive feedback for the LLM summary."
                arrow
              >
                <IconButton
                  onClick={() => handleFeedbackClick('positive')}
                  style={{
                    color: selectedFeedback === 'positive' ? '#09BC8A' : '#BDBDBD',
                  }}
                >
                  <ThumbUp />
                </IconButton>
              </Tooltip>

              <Tooltip
                title="Provide negative feedback for the LLM summary."
                arrow
              >
                <IconButton
                  onClick={() => handleFeedbackClick('negative')}
                  style={{
                    color: selectedFeedback === 'negative' ? '#FF6B6B' : '#BDBDBD',
                  }}
                >
                  <ThumbDown />
                </IconButton>
              </Tooltip>
          </div>
            {/* <Tooltip
              title="You can provide feedback for the LLM summary, and we would improve the LLM summary based on your feedback once a while."
              arrow
            >
              <Button
                variant="text"
                size="small"
                style={{
                  color: '#FBFFFB',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  marginLeft: '10px',
                  padding: '1.5px 10px', // Padding to create the ellipse effect
                  fontSize: '11px',
                  lineHeight: '1.5', // Matches the text line height
                  // border: '2px solid #555', // Dark gray border
                  borderRadius: '20px', // Ellipse shape
                  backgroundColor: '#E1E4E1', // Optional for clarity
                }}
                onClick={handleFeedbackOpen}
              >
                Provide Feedback
              </Button>
            </Tooltip> */}
          </div>
        </div>
      </div>

      {/* Thank You Message */}
      {showThankYou && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#4caf50',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.2)',
          }}
        >
          Thanks for providing feedback!
        </div>
      )}
      <div style={styles.detail}>
        <h3>Mutual Risk Paragraphs</h3>
        <div style={styles.intersectionContainer}>
          <div style={styles.intersectionColumn1}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>{source_id}</div>
            {firm1Paragraphs.map(({ paragraph, globalNumber }, index) => (
              <div
                key={`firm1-${index}`}
                style={getParagraphStyle(paragraph)}
                onClick={() => handleClick(paragraph, 'firm1')}
              >
                <div dangerouslySetInnerHTML={{ __html: paragraph.replace(/\n/g, '<br />') }} />
                <div style={styles.paragraphBar}>
                  <span style={styles.globalNumber}>{globalNumber}</span>
                  <span style={styles.relatedNumbers}>
                    Relate to {getRelatedNumbers(paragraph, 'firm1')}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div style={styles.intersectionColumn2}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>{target_id}</div>
            {firm2Paragraphs.map(({ paragraph, globalNumber }, index) => (
              <div
                key={`firm2-${index}`}
                style={getParagraphStyle(paragraph)}
                onClick={() => handleClick(paragraph, 'firm2')}
              >
                <div dangerouslySetInnerHTML={{ __html: paragraph.replace(/\n/g, '<br />') }} />
                <div style={styles.paragraphBar}>
                  <span style={styles.globalNumber}>{globalNumber}</span>
                  <span style={styles.relatedNumbers}>
                    Relate to {getRelatedNumbers(paragraph, 'firm2')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    right: 0,
    top: 0,
    bottom: 0,
    width: '40vw',
    backgroundColor: '#F5F5F5',
    boxShadow: '-2px 0px 5px rgba(0,0,0,0.1)',
    padding: '20px',
    overflowY: 'auto',
    fontFamily: 'Arial, sans-serif',
  },
  detail: {
    // marginBottom: '5px',
    fontSize: '16px',
    color: '#333',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'left',
    lineHeight: '1.5',
  },
  reason: {
    marginTop: '5px',
    padding: '5px',
    backgroundColor: '#F5F5F5',
    borderRadius: '5px',
    color: '#555',
    fontSize: '16px',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'justify',
    lineHeight: '1.5',
  },
  keywordsBlock: {
    backgroundColor: '#F5F5F5',
    padding: '5px',
    // borderRadius: '5px',
    marginBottom: '5px',
    // boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    fontFamily: 'Arial',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '100%',
    letterSpacing: '-0.75px'
  },
  keywordsList: {
    display: 'inline-flex',
    flexWrap: 'wrap',
    gap: '20px',
  },
  keywordItem: {
    backgroundColor: '#D8F3DC',
    color: '#000',
    borderRadius: '14px',
    padding: '5px 10px',
    fontFamily: 'Arial',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '100%', /* 12px */
    letterSpacing: '-0.6px'
  },
  intersectionContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    fontFamily: 'Arial, sans-serif',
  },
  intersectionColumn1: {
    width: '48%',
    backgroundColor: '#F5F5F5',//'#F5F5F5',
    padding: '5px',
    borderRadius: '5px',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'left',
    lineHeight: '1.5',
  },
  intersectionColumn2: {
    width: '48%',
    backgroundColor: '#F5F5F5',//'#F5F5F5',
    padding: '5px',
    borderRadius: '5px',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'left',
    lineHeight: '1.5',
  },
  rankRow: {
    display: 'flex',
    alignItems: 'center',
  },
  spectrumContainer: {
    position: 'relative',
    width: '200px',
    height: '20px',
    background: 'linear-gradient(to right, #95D5B2, #40916C, #1B4332)',
    borderRadius: '5px',
    marginLeft: '10px',
    position: 'relative',
  },
  spectrum: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: '5px',
  },
  spectrumLabelLeft: {
    position: 'absolute',
    left: '5px',
    top: '-25px',
    fontSize: '14px',
    color: 'black',
  },
  spectrumLabelRight: {
    position: 'absolute',
    right: '5px',
    top: '-25px',
    fontSize: '14px',
    color: 'black',
  },
  percentile_number: {
    fontSize: '1em',
  },
  ordinal_suffix: {
    fontSize: '0.6em',
    verticalAlign: 'super',
  },
  // arrowMarker: {
  //   position: 'absolute',
  //   top: '100%', // Positioned below the spectrum
  //   width: '0',
  //   height: '0',
  //   borderLeft: '10px solid transparent',
  //   borderRight: '10px solid transparent',
  //   borderTop: '10px solid #333', // Arrow color
  //   transform: 'translateX(-50%)',
  // },
  arrowMarker: {
    position: 'absolute',
    top: '100%',  // Adjust the arrow position to be above the spectrum
    width: '0',
    height: '0',
    borderLeft: '10px solid transparent',
    borderRight: '10px solid transparent',
    borderBottom: '10px solid #8F9191 ', // Arrow color
    transform: 'translateX(-50%)',
  },
  paragraphBlock: {
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '5px',
    backgroundColor: '#FAFAFA',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  paragraphBar: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#D8F3DC',
    padding: '5px',
    borderRadius: '5px',
    marginTop: '5px',
  },
  globalNumber: {
    fontWeight: 'bold',
    fontSize: '14px',
  },
  relatedNumbers: {
    fontWeight: 'bold',
    fontSize: '14px',
  },
  
};

export default RelationInfoPanel;
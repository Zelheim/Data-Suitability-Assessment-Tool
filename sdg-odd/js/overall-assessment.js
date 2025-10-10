// Overall Assessment Page Logic
(function() {
  let assessmentData = {};
  let exportFormat = 'text';

  // Initialize the page
  function init() {
    // Check session and clear storage if new session
    AssessmentStorage.checkSession();

    // Load assessment data
    assessmentData = AssessmentStorage.getData();

    // Render overall assessment
    renderOverallAssessment();

    // Setup event listeners
    var exportBtn = document.getElementById('export-btn');
    var resetBtn = document.getElementById('reset-btn');
    var returnHomeBtn = document.getElementById('return-home-btn');
    var exportFormatSelect = document.getElementById('export-format-select');
    var copyBtn = document.getElementById('copy-btn');
    var downloadBtn = document.getElementById('download-btn');

    if (exportBtn) exportBtn.addEventListener('click', showExportOverlay);
    if (resetBtn) resetBtn.addEventListener('click', handleReset);
    if (returnHomeBtn) returnHomeBtn.addEventListener('click', handleReturnHome);
    if (exportFormatSelect) exportFormatSelect.addEventListener('change', handleFormatChange);
    if (copyBtn) copyBtn.addEventListener('click', handleCopy);
    if (downloadBtn) downloadBtn.addEventListener('click', handleDownload);

    // Listen for overlay open event to generate content
    $('#export-overlay').on('open.wb-overlay', function() {
      generateExportContent();

      // Move and restyle the WET-BOEW close button
      setTimeout(function() {
        // Remove any close buttons in the top-right corner (mfp-close class)
        $('#export-overlay .mfp-close, #export-overlay button.mfp-close').remove();

        // Find the WET-BOEW close button for the footer
        var wetCloseBtn = $('#export-overlay .overlay-close').first();

        if (wetCloseBtn.length) {
          // Restyle it to match our buttons
          wetCloseBtn.removeClass().addClass('btn btn-default overlay-close');
          wetCloseBtn.text('Close'); // English

          // For French version
          if (document.documentElement.lang && document.documentElement.lang.startsWith('fr')) {
            wetCloseBtn.text('Fermer');
          }

          // Remove tooltip/title attribute
          wetCloseBtn.removeAttr('title');

          // Move it to the footer after the Download button
          wetCloseBtn.insertAfter('#download-btn');
        }

        // After moving our button, remove any remaining buttons with title containing "lose" or "ermer" that are NOT in the footer
        $('#export-overlay button[title]').not('.modal-footer button').each(function() {
          var title = $(this).attr('title');
          if (title && (title.toLowerCase().includes('lose') || title.toLowerCase().includes('ermer'))) {
            $(this).remove();
          }
        });
      }, 100);
    });
  }

  // Render overall assessment
  function renderOverallAssessment() {
    const { ethicsPrinciples, qualityDimensions, results } = assessmentData;
    const overallPass = results.ethicsPass && results.qualityPass;

    // Overall result display
    const overallResultDisplay = document.getElementById('overall-result-display');
    const alertClass = overallPass ? 'alert alert-success' : 'alert alert-danger';
    const resultText = overallPass ? t('overallPass') : t('overallFail');

    overallResultDisplay.className = alertClass;
    overallResultDisplay.setAttribute('role', 'alert');
    overallResultDisplay.innerHTML = `
      <p>
        <strong>${resultText}</strong>
      </p>
    `;

    // Overall message
    const overallMessage = document.getElementById('overall-message');
    let messageText = '';
    if (overallPass) {
      messageText = t('overallBothPass');
    } else if (results.ethicsPass && !results.qualityPass) {
      messageText = t('overallEthicsPassQualityFail');
    } else if (!results.ethicsPass && results.qualityPass) {
      messageText = t('overallEthicsFailQualityPass');
    } else {
      messageText = t('overallBothFail');
    }

    overallMessage.className = 'alert alert-info';
    overallMessage.innerHTML = `
      <p>
        ${messageText}
      </p>
    `;

    // Ethics summary
    renderEthicsSummary();

    // Quality summary
    renderQualitySummary();
  }

  // Render ethics summary
  function renderEthicsSummary() {
    const { ethicsPrinciples, results } = assessmentData;

    // Result
    const ethicsSummaryResult = document.getElementById('ethics-summary-result');
    const alertClass = results.ethicsPass ? 'alert alert-success' : 'alert alert-danger';
    const resultText = results.ethicsPass ? t('ethicsPass') : t('ethicsFail');

    ethicsSummaryResult.className = alertClass;
    ethicsSummaryResult.setAttribute('role', 'status');
    ethicsSummaryResult.innerHTML = `
      <p>
        <strong>${resultText}</strong>
      </p>
    `;

    // Message
    const ethicsSummaryMessage = document.getElementById('ethics-summary-message');
    const ethicsMessageText = results.ethicsPass ? t('ethicsPassMessage') : t('ethicsFailMessage');
    ethicsSummaryMessage.className = 'alert alert-info';
    ethicsSummaryMessage.innerHTML = `
      <p>
        ${ethicsMessageText}
      </p>
    `;

    // Generate list
    let listHTML = '<div class="mrgn-tp-lg">';

    window.ETHICS_PRINCIPLES.forEach(principle => {
      const answer = ethicsPrinciples[principle.id];
      const answerText = answer === 'Yes' ? t('yes') : answer === 'No' ? t('no') : t('notEvaluated');
      const answerIcon = answer === 'Yes' ? '<span class="glyphicon glyphicon-ok-sign text-success" aria-hidden="true"></span>' : answer === 'No' ? '<span class="glyphicon glyphicon-remove-sign text-danger" aria-hidden="true"></span>' : '<span class="glyphicon glyphicon-question-sign text-muted" aria-hidden="true"></span>';
      const labelClass = answer === 'Yes' ? 'label-success' : answer === 'No' ? 'label-danger' : 'label-default';

      listHTML += `
        <div class="panel panel-default mrgn-bttm-md">
          <div class="panel-body">
            <div class="row">
              <div class="col-sm-8">
                <h3 class="h5 mrgn-tp-0 mrgn-bttm-0">${principle.element}</h3>
              </div>
              <div class="col-sm-4 text-right">
                <span class="h5 mrgn-tp-0 mrgn-bttm-0">
                  ${answerIcon}
                  <span class="label ${labelClass} mrgn-lft-sm" style="font-size: 1em;">${answerText}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    listHTML += '</div>';

    document.getElementById('ethics-summary-table').innerHTML = listHTML;
  }

  // Render quality summary
  function renderQualitySummary() {
    const { qualityDimensions, results } = assessmentData;

    // Result
    const qualitySummaryResult = document.getElementById('quality-summary-result');
    const alertClass = results.qualityPass ? 'alert alert-success' : 'alert alert-danger';
    const resultText = results.qualityPass ? t('qualityPass') : t('qualityFail');

    qualitySummaryResult.className = alertClass;
    qualitySummaryResult.setAttribute('role', 'status');
    qualitySummaryResult.innerHTML = `
      <p>
        <strong>${resultText}</strong>
      </p>
    `;

    // Message - regenerate based on score to support language switching
    const qualitySummaryMessage = document.getElementById('quality-summary-message');
    const totalScore = results.totalQualityScore;
    const hasZeroScore = Object.values(qualityDimensions).some(score => score === 0);

    let qualityMessageText = '';
    if (hasZeroScore) {
      qualityMessageText = t('qualityFailMessage');
    } else if (totalScore <= 9) {
      qualityMessageText = t('qualityLowMessage');
    } else if (totalScore >= 10 && totalScore <= 12) {
      qualityMessageText = t('qualityMediumMessage');
    } else if (totalScore >= 13) {
      qualityMessageText = t('qualityHighMessage');
    }

    qualitySummaryMessage.className = 'alert alert-info';
    qualitySummaryMessage.innerHTML = `
      <p>
        ${qualityMessageText}
      </p>
    `;

    // Generate summary list
    let summaryHTML = '<div class="mrgn-tp-lg">';

    window.QUALITY_DIMENSIONS.forEach(dimension => {
      const score = qualityDimensions[dimension.id] || 0;

      // Determine score badge color
      const scoreClass = score === 0 ? 'label-danger' : score === 3 ? 'label-success' : 'label-warning';

      // Calculate criteria satisfaction based on score
      const criteriaSatisfied = [];
      for (let i = 0; i < dimension.criteria.length; i++) {
        if (dimension.id === "3") {
          criteriaSatisfied.push(score >= 2 || (score === 1 && i === 0));
        } else {
          criteriaSatisfied.push(i < score);
        }
      }

      const criteriaHTML = dimension.criteria.map((criterion, idx) => {
        const satisfied = criteriaSatisfied[idx];
        const icon = satisfied ? '<span class="glyphicon glyphicon-ok-circle text-success" aria-hidden="true"></span>' : '<span class="glyphicon glyphicon-remove-circle text-danger" aria-hidden="true"></span>';
        const statusLabel = satisfied ? `<strong class="text-success">${t('satisfiedLabel')}</strong>` : `<strong class="text-danger">${t('notSatisfiedLabel')}</strong>`;
        return `<li class="mrgn-bttm-sm">${icon} ${statusLabel} ${criterion}</li>`;
      }).join('');

      summaryHTML += `
        <section class="panel panel-default mrgn-bttm-lg" aria-labelledby="overall-quality-title-${dimension.id}">
          <header class="panel-heading">
            <h3 id="overall-quality-title-${dimension.id}" class="panel-title">${dimension.element}</h3>
          </header>
          <div class="panel-body">
            <div class="row">
              <div class="col-md-12">
                <div class="well well-sm mrgn-bttm-md">
                  <span class="mrgn-tp-0 mrgn-bttm-0">
                    <strong>${t('scoreLabel')}</strong> <span class="label ${scoreClass} mrgn-lft-sm" style="font-size: 1em;">${score}/3</span>
                  </span>
                </div>
              </div>
            </div>
            <h4 id="overall-quality-criteria-${dimension.id}" class="h5 mrgn-tp-md mrgn-bttm-sm">${t('criteriaAssessmentLabel')}</h4>
            <ul class="list-unstyled mrgn-lft-lg" aria-labelledby="overall-quality-criteria-${dimension.id}">
              ${criteriaHTML}
            </ul>
          </div>
        </section>
      `;
    });

    summaryHTML += '</div>';

    document.getElementById('quality-summary-table').innerHTML = summaryHTML;

    // Total score
    document.getElementById('total-score-display').textContent = `${results.totalQualityScore}/15`;
  }

  // Show export overlay using WET-BOEW overlay component
  function showExportOverlay() {
    $('#export-overlay').trigger('open.wb-overlay');
  }

  // Handle format change
  function handleFormatChange(e) {
    exportFormat = e.target.value;
    generateExportContent();
  }

  // Generate export content
  function generateExportContent() {
    const { ethicsPrinciples, qualityDimensions, results } = assessmentData;
    const date = results.date || new Date().toISOString().split('T')[0];
    const overallPass = results.ethicsPass && results.qualityPass;

    let content = '';

    if (exportFormat === 'text') {
      content = generateTextExport(date, overallPass, ethicsPrinciples, qualityDimensions, results);
      document.getElementById('export-preview').value = content;
      document.getElementById('export-preview-container').classList.remove('hidden');
      document.getElementById('export-info').classList.add('hidden');
      document.getElementById('copy-btn').disabled = false;
    } else if (exportFormat === 'csv') {
      content = generateCSVExport(date, overallPass, ethicsPrinciples, qualityDimensions, results);
      document.getElementById('export-preview').value = content;
      document.getElementById('export-preview-container').classList.remove('hidden');
      document.getElementById('export-info').classList.add('hidden');
      document.getElementById('copy-btn').disabled = false;
    } else if (exportFormat === 'pdf' || exportFormat === 'word') {
      document.getElementById('export-preview-container').classList.add('hidden');
      document.getElementById('export-info').classList.remove('hidden');
      document.getElementById('export-info-text').innerHTML = exportFormat === 'pdf' ? t('pdfPreview') : t('wordPreview');
      document.getElementById('copy-btn').disabled = true;
    }
  }

  // Generate text export
  function generateTextExport(date, overallPass, ethicsPrinciples, qualityDimensions, results) {
    let content = `${t('exportTitle')}\n`;
    content += `${t('dateLabel')} ${date}\n\n`;
    content += `${t('overallResultLabel')} ${overallPass ? t('overallPass') : t('overallFail')}\n\n`;

    // Ethics
    const ethicsMessageText = results.ethicsPass ? t('ethicsPassMessage') : t('ethicsFailMessage');
    content += `${t('ethicsPrinciplesTitle')}\n`;
    content += `${t('ethicsAssessmentLabel')} ${results.ethicsPass ? t('ethicsPass') : t('ethicsFail')}\n`;
    content += `${t('messageLabel')} ${ethicsMessageText.replace(/<[^>]*>/g, '')}\n\n`;
    content += `${t('ethicsPrinciplesLabel')}\n`;

    window.ETHICS_PRINCIPLES.forEach(principle => {
      const answer = ethicsPrinciples[principle.id];
      const answerText = answer === 'Yes' ? t('yes') : answer === 'No' ? t('no') : t('notEvaluated');
      content += `- ${principle.element}: ${answerText}\n`;
    });

    // Quality
    const totalScore = results.totalQualityScore;
    const hasZeroScore = Object.values(qualityDimensions).some(score => score === 0);
    let qualityMessageText = '';
    if (hasZeroScore) {
      qualityMessageText = t('qualityFailMessage');
    } else if (totalScore <= 9) {
      qualityMessageText = t('qualityLowMessage');
    } else if (totalScore >= 10 && totalScore <= 12) {
      qualityMessageText = t('qualityMediumMessage');
    } else if (totalScore >= 13) {
      qualityMessageText = t('qualityHighMessage');
    }

    content += `\n${t('qualityDimensionsTitle')}\n`;
    content += `${t('qualityAssessmentLabel')} ${results.qualityPass ? t('qualityPass') : t('qualityFail')} (${t('scoreLabel')} ${results.totalQualityScore}/15)\n`;
    content += `${t('messageLabel')} ${qualityMessageText.replace(/<[^>]*>/g, '')}\n\n`;
    content += `${t('qualityDimensionsLabel')}\n`;

    window.QUALITY_DIMENSIONS.forEach(dimension => {
      const score = qualityDimensions[dimension.id] || 0;
      const assessment = getQualityScoreText(score);
      content += `- ${dimension.element}: ${score}/3 - ${assessment}\n`;

      // Criteria details
      const criteriaSatisfied = [];
      for (let i = 0; i < dimension.criteria.length; i++) {
        if (dimension.id === "3") {
          criteriaSatisfied.push(score >= 2 || (score === 1 && i === 0));
        } else {
          criteriaSatisfied.push(i < score);
        }
      }

      content += `  ${t('criteriaDetailsLabel')}\n`;
      dimension.criteria.forEach((criterion, idx) => {
        const status = criteriaSatisfied[idx] ? t('satisfied') : t('notSatisfied');
        content += `    ${idx + 1}. ${criterion}: ${status}\n`;
      });
      content += '\n';
    });

    return content;
  }

  // Generate CSV export
  function generateCSVExport(date, overallPass, ethicsPrinciples, qualityDimensions, results) {
    // Regenerate messages in current language
    const ethicsMessageText = results.ethicsPass ? t('ethicsPassMessage') : t('ethicsFailMessage');

    const totalScore = results.totalQualityScore;
    const hasZeroScore = Object.values(qualityDimensions).some(score => score === 0);
    let qualityMessageText = '';
    if (hasZeroScore) {
      qualityMessageText = t('qualityFailMessage');
    } else if (totalScore <= 9) {
      qualityMessageText = t('qualityLowMessage');
    } else if (totalScore >= 10 && totalScore <= 12) {
      qualityMessageText = t('qualityMediumMessage');
    } else if (totalScore >= 13) {
      qualityMessageText = t('qualityHighMessage');
    }

    let content = `${t('exportTitle')}\r\n\r\n`;
    content += `${t('summaryLabel')}\r\n`;
    content += `${t('categoryLabel')},${t('resultLabel')}\r\n`;
    content += `${t('dateLabel').replace(':', '')},${date}\r\n`;
    content += `${t('overallResultLabel').replace(':', '')},${overallPass ? t('overallPass') : t('overallFail')}\r\n`;
    content += `${t('ethicsAssessmentLabel').replace(':', '')},${results.ethicsPass ? t('ethicsPass') : t('ethicsFail')}\r\n`;
    content += `${t('qualityAssessmentLabel').replace(':', '')},${results.qualityPass ? t('qualityPass') : t('qualityFail')}\r\n`;
    content += `${t('scoreLabel').replace(':', '')},${results.totalQualityScore}/15\r\n\r\n`;

    // Ethics
    content += `${t('ethicsPrinciplesTitle')}\r\n`;
    content += `${t('messageLabel').replace(':', '')},"${ethicsMessageText.replace(/<[^>]*>/g, '').replace(/"/g, '""')}"\r\n\r\n`;
    content += `${t('ethicsPrincipleLabel')},${t('evaluationLabel')}\r\n`;

    window.ETHICS_PRINCIPLES.forEach(principle => {
      const answer = ethicsPrinciples[principle.id];
      const answerText = answer === 'Yes' ? t('yes') : answer === 'No' ? t('no') : t('notEvaluated');
      content += `"${principle.element}","${answerText}"\r\n`;
    });

    content += "\r\n";

    // Quality
    content += `${t('qualityDimensionsTitle')}\r\n`;
    content += `${t('messageLabel').replace(':', '')},"${qualityMessageText.replace(/<[^>]*>/g, '').replace(/"/g, '""')}"\r\n\r\n`;
    content += `${t('qualityDimensionLabel')},${t('scoreLabel').replace(':', '')},${t('assessmentLabel')},${t('criteriaDetailsLabel').replace(':', '')}\r\n`;

    window.QUALITY_DIMENSIONS.forEach(dimension => {
      const score = qualityDimensions[dimension.id] || 0;
      const assessment = getQualityScoreText(score);

      const criteriaSatisfied = [];
      for (let i = 0; i < dimension.criteria.length; i++) {
        if (dimension.id === "3") {
          criteriaSatisfied.push(score >= 2 || (score === 1 && i === 0));
        } else {
          criteriaSatisfied.push(i < score);
        }
      }

      const criteriaDetails = dimension.criteria.map((criterion, idx) => {
        const status = criteriaSatisfied[idx] ? t('satisfied') : t('notSatisfied');
        return `${idx + 1}. ${criterion}: ${status}`;
      }).join('; ');

      content += `"${dimension.element}",${score}/3,"${assessment}","${criteriaDetails.replace(/"/g, '""')}"\r\n`;
    });

    return content;
  }

  // Handle copy to clipboard
  function handleCopy() {
    const preview = document.getElementById('export-preview');
    const text = preview.value;

    // Use modern Clipboard API if available, fallback to deprecated method
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
      }).catch(() => {
        // Fallback to old method if modern API fails
        fallbackCopy(preview);
      });
    } else {
      // Fallback for older browsers
      fallbackCopy(preview);
    }
  }

  // Fallback copy method for older browsers
  function fallbackCopy(element) {
    element.select();
    try {
      document.execCommand('copy');
      alert('Copied to clipboard!');
    } catch (err) {
      alert('Failed to copy to clipboard. Please copy manually.');
    }
  }

  // Handle download
  async function handleDownload() {
    const date = assessmentData.results.date || new Date().toISOString().split('T')[0];
    const filePrefix = t('fileNamePrefix') || 'data-suitability-assessment';
    let fileName = `${filePrefix}-${date}`;

    if (exportFormat === 'text') {
      fileName += '.txt';
      const blob = new Blob([document.getElementById('export-preview').value], { type: 'text/plain' });
      downloadBlob(blob, fileName);
    } else if (exportFormat === 'csv') {
      fileName += '.csv';
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + document.getElementById('export-preview').value], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, fileName);
    } else if (exportFormat === 'pdf') {
      fileName += '.pdf';
      await generatePDFExport(fileName);
    } else if (exportFormat === 'word') {
      fileName += '.docx';
      await generateWordExport(fileName);
    }
  }

  // Download blob helper
  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Generate PDF export without external library
  function generatePDFExport(fileName) {
    const { ethicsPrinciples, qualityDimensions, results } = assessmentData;
    const date = results.date || new Date().toISOString().split('T')[0];
    const overallPass = results.ethicsPass && results.qualityPass;

    // Build HTML content for PDF
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${t('exportTitle')}</title>
  <style>
    @page { margin: 1in; }
    body {
      font-family: Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.4;
    }
    h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 12pt;
      page-break-after: avoid;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 24pt;
      margin-bottom: 12pt;
      page-break-after: avoid;
    }
    p { margin: 6pt 0; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12pt 0;
      page-break-inside: auto;
    }
    tr { page-break-inside: avoid; page-break-after: auto; }
    th, td {
      border: 1px solid black;
      padding: 6pt;
      text-align: left;
    }
    th {
      background-color: #e0e0e0;
      font-weight: bold;
    }
    .criteria-list {
      margin: 6pt 0;
      padding-left: 20pt;
    }
    .criteria-item {
      margin: 3pt 0;
    }
    .status-satisfied {
      color: #006400;
      font-weight: bold;
    }
    .status-not-satisfied {
      color: #8B0000;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>${t('exportTitle')}</h1>
  <p><strong>${t('dateLabel')}</strong> ${date}</p>
  <h2>${t('overallResultLabel')} ${overallPass ? t('passLabel') : t('failLabel')}</h2>

  <h2>${t('ethicsPrinciplesTitle')}</h2>
  <p><strong>${t('assessmentLabel')}:</strong> ${results.ethicsPass ? t('passLabel') : t('failLabel')}</p>

  <table>
    <thead>
      <tr>
        <th>${t('principleLabel')}</th>
        <th>${t('answerTableLabel')}</th>
      </tr>
    </thead>
    <tbody>
`;

    window.ETHICS_PRINCIPLES.forEach(principle => {
      const answer = ethicsPrinciples[principle.id];
      const answerText = answer === 'Yes' ? t('yes') : answer === 'No' ? t('no') : t('notEvaluated');
      html += `
      <tr>
        <td>${principle.element}</td>
        <td>${answerText}</td>
      </tr>`;
    });

    html += `
    </tbody>
  </table>

  <h2>${t('qualityDimensionsTitle')}</h2>
  <p><strong>${t('assessmentLabel')}:</strong> ${results.qualityPass ? t('passLabel') : t('failLabel')} (${t('scoreLabel')} ${results.totalQualityScore}/15)</p>

  <table>
    <thead>
      <tr>
        <th>${t('dimensionLabel')}</th>
        <th>${t('scoreLabel').replace(':', '')}</th>
        <th>${t('assessmentLabel')}</th>
      </tr>
    </thead>
    <tbody>
`;

    window.QUALITY_DIMENSIONS.forEach(dimension => {
      const score = qualityDimensions[dimension.id] || 0;
      const assessment = getQualityScoreText(score);

      // Calculate criteria satisfaction based on score
      const criteriaSatisfied = [];
      for (let i = 0; i < dimension.criteria.length; i++) {
        if (dimension.id === "3") {
          criteriaSatisfied.push(score >= 2 || (score === 1 && i === 0));
        } else {
          criteriaSatisfied.push(i < score);
        }
      }

      let criteriaHTML = '<div class="criteria-list">';
      dimension.criteria.forEach((criterion, idx) => {
        const satisfied = criteriaSatisfied[idx];
        const statusClass = satisfied ? 'status-satisfied' : 'status-not-satisfied';
        const statusText = satisfied ? t('satisfied') : t('notSatisfied');
        criteriaHTML += `<div class="criteria-item"><span class="${statusClass}">${statusText}:</span> ${criterion}</div>`;
      });
      criteriaHTML += '</div>';

      html += `
      <tr>
        <td>${dimension.element}${criteriaHTML}</td>
        <td>${score}/3</td>
        <td>${assessment}</td>
      </tr>`;
    });

    html += `
    </tbody>
  </table>
</body>
</html>`;

    // For PDF, we'll use print functionality
    // Open in new window and trigger print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
      // Note: User will need to "Save as PDF" in their print dialog
    };
  }

  // Generate Word export using DOCX generator
  function generateWordExport(fileName) {
    const { ethicsPrinciples, qualityDimensions, results } = assessmentData;
    const date = results.date || new Date().toISOString().split('T')[0];
    const overallPass = results.ethicsPass && results.qualityPass;

    // Build structured content array for DOCX
    const content = [];

    // Title
    content.push({ type: 'title', text: t('exportTitle') });
    content.push({ type: 'paragraph', text: `${t('dateLabel')} ${date}`, bold: true });
    content.push({ type: 'spacer' });

    // Overall Result
    content.push({
      type: 'alert',
      style: overallPass ? 'success' : 'danger',
      text: `${t('overallResultLabel')} ${overallPass ? t('overallPass') : t('overallFail')}`
    });
    content.push({ type: 'spacer' });

    // Overall Message
    let overallMessage = '';
    if (overallPass) {
      overallMessage = t('overallBothPass');
    } else if (results.ethicsPass && !results.qualityPass) {
      overallMessage = t('overallEthicsPassQualityFail');
    } else if (!results.ethicsPass && results.qualityPass) {
      overallMessage = t('overallEthicsFailQualityPass');
    } else {
      overallMessage = t('overallBothFail');
    }
    content.push({ type: 'infoBox', text: overallMessage.replace(/<[^>]*>/g, '') });
    content.push({ type: 'spacer' });

    // Ethics Section
    content.push({ type: 'heading', text: `Part 1 - ${t('ethicsPrinciplesTitle')}` });

    // Ethics Result
    content.push({
      type: 'alert',
      style: results.ethicsPass ? 'success' : 'danger',
      text: `${t('ethicsAssessmentLabel')} ${results.ethicsPass ? t('ethicsPass') : t('ethicsFail')}`
    });

    // Ethics Message
    const ethicsMessageText = results.ethicsPass ? t('ethicsPassMessage') : t('ethicsFailMessage');
    content.push({ type: 'infoBox', text: ethicsMessageText.replace(/<[^>]*>/g, '') });
    content.push({ type: 'spacer' });

    // Ethics Principles Table
    const ethicsRows = [];
    window.ETHICS_PRINCIPLES.forEach(principle => {
      const answer = ethicsPrinciples[principle.id];
      const answerText = answer === 'Yes' ? t('yes') : answer === 'No' ? t('no') : t('notEvaluated');
      const answerColor = answer === 'Yes' ? '3C763D' : answer === 'No' ? 'A94442' : '999999';
      const answerBgColor = answer === 'Yes' ? 'DFF0D8' : answer === 'No' ? 'F2DEDE' : 'F5F5F5';

      ethicsRows.push([
        { text: principle.element },
        { text: answerText, color: answerColor, bgColor: answerBgColor, bold: true }
      ]);
    });

    content.push({
      type: 'table',
      headers: [t('principleLabel') || 'Principle', t('answerTableLabel') || 'Answer'],
      rows: ethicsRows
    });
    content.push({ type: 'spacer' });

    // Quality Section
    content.push({ type: 'heading', text: `Part 2 - ${t('qualityDimensionsTitle')}` });

    // Quality Result
    content.push({
      type: 'alert',
      style: results.qualityPass ? 'success' : 'danger',
      text: `${t('qualityAssessmentLabel')} ${results.qualityPass ? t('qualityPass') : t('qualityFail')} (${t('scoreLabel')} ${results.totalQualityScore}/15)`
    });

    // Quality Message
    const totalScore = results.totalQualityScore;
    const hasZeroScore = Object.values(qualityDimensions).some(score => score === 0);
    let qualityMessageText = '';
    if (hasZeroScore) {
      qualityMessageText = t('qualityFailMessage');
    } else if (totalScore <= 9) {
      qualityMessageText = t('qualityLowMessage');
    } else if (totalScore >= 10 && totalScore <= 12) {
      qualityMessageText = t('qualityMediumMessage');
    } else if (totalScore >= 13) {
      qualityMessageText = t('qualityHighMessage');
    }
    content.push({ type: 'infoBox', text: qualityMessageText.replace(/<[^>]*>/g, '') });
    content.push({ type: 'spacer' });

    // Quality Dimensions - Each as a section
    window.QUALITY_DIMENSIONS.forEach(dimension => {
      const score = qualityDimensions[dimension.id] || 0;
      const assessment = getQualityScoreText(score);

      content.push({ type: 'subheading', text: dimension.element });

      // Score display
      content.push({
        type: 'alert',
        style: score === 0 ? 'danger' : score === 3 ? 'success' : 'warning',
        text: `${t('scoreLabel')} ${score}/3 - ${assessment}`
      });

      // Criteria satisfaction
      const criteriaSatisfied = [];
      for (let i = 0; i < dimension.criteria.length; i++) {
        if (dimension.id === "3") {
          criteriaSatisfied.push(score >= 2 || (score === 1 && i === 0));
        } else {
          criteriaSatisfied.push(i < score);
        }
      }

      // Criteria table
      const criteriaRows = [];
      dimension.criteria.forEach((criterion, idx) => {
        const satisfied = criteriaSatisfied[idx];
        const statusText = satisfied ? t('satisfied') : t('notSatisfied');
        const statusColor = satisfied ? '3C763D' : 'A94442';
        const statusBgColor = satisfied ? 'DFF0D8' : 'F2DEDE';

        criteriaRows.push([
          { text: criterion },
          { text: statusText, color: statusColor, bgColor: statusBgColor, bold: true }
        ]);
      });

      content.push({
        type: 'table',
        headers: [t('criteriaAssessmentLabel') || 'Criteria', t('statusLabel') || 'Status'],
        rows: criteriaRows
      });
      content.push({ type: 'spacer' });
    });

    // Total Score Summary
    content.push({ type: 'paragraph', text: `${t('totalScoreLabel')}: ${results.totalQualityScore}/15`, bold: true });

    // Create DOCX blob using the docx-generator
    const blob = window.createDocx(content);
    downloadBlob(blob, fileName);
  }

  // Handle reset
  function handleReset(e) {
    e.preventDefault();
    // Clear all localStorage
    localStorage.clear();
    // Redirect to ethics assessment page
    window.location.href = 'ethics-assessment.html';
  }

  // Handle return home
  function handleReturnHome(e) {
    e.preventDefault();
    // Clear all localStorage
    AssessmentStorage.reset();
    // Redirect to home page
    window.location.href = 'index.html';
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

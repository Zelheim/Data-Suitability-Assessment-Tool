// Quality Assessment Page Logic
(function() {
  let qualityScores = {};
  let criteriaSatisfaction = {};
  let totalScore = 0;
  let showResult = false;

  // Initialize the page
  function init() {
    // Check session and clear storage if new session
    AssessmentStorage.checkSession();

    // Load saved data
    qualityScores = AssessmentStorage.getQualityScores();
    criteriaSatisfaction = AssessmentStorage.getCriteriaSatisfaction();

    // Initialize default values
    QUALITY_DIMENSIONS.forEach(dimension => {
      if (qualityScores[dimension.id] === undefined) {
        qualityScores[dimension.id] = 0;
      }
      if (!criteriaSatisfaction[dimension.id]) {
        criteriaSatisfaction[dimension.id] = new Array(dimension.criteria.length).fill(false);
      }
    });

    // Calculate total score
    calculateTotalScore();

    // Render dimensions
    renderQualityDimensions();

    // Setup event listeners
    document.getElementById('evaluate-quality-btn').addEventListener('click', handleEvaluate);
    document.getElementById('evaluate-quality-btn-resubmit').addEventListener('click', handleEvaluate);
    document.getElementById('continue-quality-btn').addEventListener('click', handleContinue);
  }

  // Calculate total score
  function calculateTotalScore() {
    totalScore = Object.values(qualityScores).reduce((sum, score) => sum + score, 0);
  }

  // Render quality dimensions form
  function renderQualityDimensions() {
    const list = document.getElementById('quality-dimensions-list');
    list.innerHTML = '';

    QUALITY_DIMENSIONS.forEach(dimension => {
      const li = document.createElement('li');
      li.className = 'mrgn-bttm-lg';

      const score = qualityScores[dimension.id] || 0;

      const checkboxesHTML = dimension.criteria.map((criterion, idx) => {
        const checked = criteriaSatisfaction[dimension.id]?.[idx] || false;
        return `
          <div class="checkbox mrgn-bttm-sm">
            <label for="quality-${dimension.id}-${idx}">
              <input
                id="quality-${dimension.id}-${idx}"
                type="checkbox"
                data-dimension-id="${dimension.id}"
                data-criterion-idx="${idx}"
                ${checked ? 'checked' : ''}
                aria-describedby="quality-el-${dimension.id}"
              />
              ${criterion}
            </label>
          </div>
        `;
      }).join('');

      li.innerHTML = `
        <div class="well mrgn-bttm-0">
          <fieldset>
          <legend>
            <h3 id="quality-el-${dimension.id}" class="h6 mrgn-tp-0 mrgn-bttm-md brdr-bttm">
              ${dimension.element}
            </h3>
          </legend>

            <div class="mrgn-bttm-md">
              <h4 id="quality-def-${dimension.id}" class="mrgn-bttm-sm">${t('definitionLabel')}</h4>
              <p>${dimension.definition}</p>
            </div>

            <div class="mrgn-bttm-md">
              <h4 id="quality-crit-heading-${dimension.id}" class="mrgn-bttm-sm">${t('criteriaSelectAll')}</h4>
              <div id="quality-crit-${dimension.id}" role="group" aria-labelledby="quality-crit-heading-${dimension.id}">
                ${checkboxesHTML}
              </div>
            </div>

            <div class="mrgn-tp-md mrgn-bttm-0">
              <span class="mrgn-tp-0 mrgn-bttm-0">
                <strong>${t('scoringLabel')} :</strong> <span id="score-${dimension.id}" class="label ${score === 0 ? 'label-danger' : score === 3 ? 'label-success' : 'label-warning'} mrgn-lft-sm" style="font-size: 1em;">${score}/${dimension.maxScore}</span>
              </span>
            </div>
          </fieldset>
        </div>
      `;

      list.appendChild(li);
    });

    // Add change listeners
    document.querySelectorAll('input[type="checkbox"][data-dimension-id]').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const dimensionId = this.dataset.dimensionId;
        const criterionIdx = parseInt(this.dataset.criterionIdx);
        handleCriteriaChange(dimensionId, criterionIdx, this.checked);
      });
    });
  }

  // Handle criteria checkbox change
  function handleCriteriaChange(dimensionId, criterionIdx, checked) {
    if (!criteriaSatisfaction[dimensionId]) {
      const dimension = QUALITY_DIMENSIONS.find(d => d.id === dimensionId);
      criteriaSatisfaction[dimensionId] = new Array(dimension.criteria.length).fill(false);
    }

    criteriaSatisfaction[dimensionId][criterionIdx] = checked;

    // Calculate score for this dimension
    const satisfiedCount = criteriaSatisfaction[dimensionId].filter(Boolean).length;

    // Special case for Accessibility and clarity (dimension 3)
    let score = satisfiedCount;
    if (dimensionId === "3" && satisfiedCount === 2) {
      score = 3;
    }

    qualityScores[dimensionId] = score;

    // Update display
    const scoreDisplay = document.getElementById(`score-${dimensionId}`);
    const dimension = QUALITY_DIMENSIONS.find(d => d.id === dimensionId);
    if (scoreDisplay) {
      scoreDisplay.textContent = `${score}/${dimension.maxScore}`;

      // Update label color based on score
      scoreDisplay.className = `label ${score === 0 ? 'label-danger' : score === 3 ? 'label-success' : 'label-warning'} mrgn-lft-sm`;
      scoreDisplay.style.fontSize = '1em';
    }

    // Calculate and save total score
    calculateTotalScore();
    AssessmentStorage.saveQualityScores(qualityScores, criteriaSatisfaction);
  }

  // Handle evaluate button click
  function handleEvaluate() {
    // Check if any dimension has a score of 0
    const hasZeroScore = QUALITY_DIMENSIONS.some(dimension =>
      qualityScores[dimension.id] === 0
    );

    // Fail if any score is 0 or if total score is 7 or less
    const qualityPass = !hasZeroScore && totalScore >= 8;

    // Determine message
    let message = '';
    if (hasZeroScore) {
      message = t('qualityFailMessage');
    } else if (totalScore <= 7) {
      message = t('qualityLowMessage');
    } else if (totalScore >= 8 && totalScore <= 10) {
      message = t('qualityMediumMessage');
    } else if (totalScore >= 11 && totalScore < 15) {
      message = t('qualityHighMessage');
    } else if (totalScore === 15) {
      message = t('qualityMaxMessage');
    }

    // Save results
    AssessmentStorage.saveQualityResults(qualityPass, totalScore, message);

    // Show results
    showResults(qualityPass, message);
  }

  // Show results
  function showResults(qualityPass, message) {
    showResult = true;

    const resultsSection = document.getElementById('quality-results');
    const summaryTable = document.getElementById('quality-summary-table');
    const totalScoreDisplay = document.getElementById('total-score-display');
    const resultDisplay = document.getElementById('quality-result-display');
    const resultMessage = document.getElementById('quality-result-message');

    // Hide submit button container and show results
    document.getElementById('submit-button-container').classList.add('hidden');
    resultsSection.classList.remove('hidden');

    // Generate summary list
    let summaryHTML = '<div class="mrgn-tp-lg">';

    QUALITY_DIMENSIONS.forEach(dimension => {
      const score = qualityScores[dimension.id] || 0;
      const criteria = criteriaSatisfaction[dimension.id] || [];

      // Determine score badge color
      const scoreClass = score === 0 ? 'label-danger' : score === 3 ? 'label-success' : 'label-warning';

      const criteriaHTML = dimension.criteria.map((criterion, idx) => {
        const satisfied = criteria[idx] || false;
        const icon = satisfied ? '<span class="glyphicon glyphicon-ok-circle text-success" aria-hidden="true"></span>' : '<span class="glyphicon glyphicon-remove-circle text-danger" aria-hidden="true"></span>';
        const statusLabel = satisfied ? `<strong class="text-success">${t('satisfiedLabel')}</strong>` : `<strong class="text-danger">${t('notSatisfiedLabel')}</strong>`;
        return `<li class="mrgn-bttm-sm">${icon} ${statusLabel} ${criterion}</li>`;
      }).join('');

      summaryHTML += `
        <section class="panel panel-default mrgn-bttm-lg" aria-labelledby="quality-summary-title-${dimension.id}">
          <header class="panel-heading">
            <h3 id="quality-summary-title-${dimension.id}" class="panel-title">${dimension.element}</h3>
          </header>
          <div class="panel-body">
            <div class="row">
              <div class="col-md-12">
                <div class="well well-sm mrgn-bttm-md">
                  <span class="mrgn-tp-0 mrgn-bttm-0">
                    <strong>${t('scoreLabel')}</strong> <span class="label ${scoreClass} mrgn-lft-sm" style="font-size: 1em;">${score}/${dimension.maxScore}</span>
                  </span>
                </div>
              </div>
            </div>
            <h4 id="quality-summary-criteria-${dimension.id}" class="mrgn-tp-md mrgn-bttm-sm">${t('criteriaAssessmentLabel')}</h4>
            <ul class="list-unstyled mrgn-lft-lg" aria-labelledby="quality-summary-criteria-${dimension.id}">
              ${criteriaHTML}
            </ul>
          </div>
        </section>
      `;
    });

    summaryHTML += '</div>';

    summaryTable.innerHTML = summaryHTML;

    // Total score
    totalScoreDisplay.textContent = `${totalScore}/15`;

    // Result display
    const alertClass = qualityPass ? 'alert alert-success' : 'alert alert-danger';
    const resultText = qualityPass ? t('qualityPass') : t('qualityFail');

    resultDisplay.innerHTML = `
      <div class="${alertClass}" role="alert" aria-live="polite">
        <p>
          <strong>${resultText}</strong>
        </p>
      </div>
    `;

    // Result message
    resultMessage.className = 'alert alert-info';
    resultMessage.setAttribute('role', 'status');
    resultMessage.setAttribute('aria-live', 'polite');
    resultMessage.innerHTML = `
      <p>
        ${message}
      </p>
    `;

    // Focus on results
    setTimeout(() => {
      resultsSection.focus();
    }, 100);
  }

  // Handle continue button click
  function handleContinue() {
    AssessmentStorage.calculateOverallPass();
    // Detect language from HTML lang attribute
    const lang = document.documentElement.lang || 'en';
    const langPath = lang === 'fr' ? 'fr' : 'en';
    window.location.href = `overall-assessment.html`;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

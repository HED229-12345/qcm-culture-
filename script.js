let score = 0
let filesAttente = [];
let questionActuelle = null;
let tempsRestant = 10;
let minuteur = null;
let meilleurScore = 0;

function chargerMeilleurScore() {
  const stocke = localStorage.getItem('qcm-meilleur-score');
  meilleurScore = stocke ? parseInt(stocke, 10) : 0;
  document.getElementById('best-score-value').textContent = meilleurScore;
}

function mettreAJourMeilleurScore() {
  if (score > meilleurScore) {
    meilleurScore = score;
    localStorage.setItem('qcm-meilleur-score', meilleurScore);
    document.getElementById('best-score-value').textContent = meilleurScore;
  }
}
function decoderTexte(texte) {
    const temp = document.createElement('textarea');
    temp.innerHTML = texte;
    return temp.value;
}
async function traduire(texte) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texte)}&langpair=en|fr`;
    const reponse = await fetch(url);
    const donnees = await reponse.json();
    return donnees.responseData.translatedText;
}
async function chargerQuestions() {
    const reponse = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
    const donnees = await reponse.json();

    for (const item of donnees.results) {
        const questionFr = await traduire(decoderTexte(item.question));
        const mauvaisesReponsesFr = [];
        for (const mauvaise of item.incorrect_answers) {
            mauvaisesReponsesFr.push(await traduire(decoderTexte(mauvaise)));
        }
        const bonneReponseFr = await traduire(decoderTexte(item.correct_answer));

        const choix = [...mauvaisesReponsesFr, bonneReponseFr];
        for (let i = choix.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [choix[i], choix[j]] = [choix[j], choix[i]];
        }
        filesAttente.push({
            q: questionFr,
            choix: choix,
            bonne: choix.indexOf(bonneReponseFr)
        });
    }
}

function afficherQuestion() {
  if (filesAttente.length === 0) {
    document.getElementById('question').textContent = "Chargement de nouvelles questions...";
    document.getElementById('choices').innerHTML = "";
    chargerQuestions().then(() => afficherQuestion());
    return;
  }

  questionActuelle = filesAttente.shift();
  document.getElementById('question').textContent = questionActuelle.q;

  const zoneChoix = document.getElementById('choices');
  zoneChoix.innerHTML = "";
  questionActuelle.choix.forEach((texteChoix, i) => {
    const bouton = document.createElement('button');
    bouton.className = 'choice-btn';
    bouton.textContent = texteChoix;
    bouton.addEventListener('click', () => validerReponse(i));
    zoneChoix.appendChild(bouton);
  });
  demarrerMinuteur();
}

function demarrerMinuteur() {
  tempsRestant = 15;
  document.getElementById('time-left').textContent = tempsRestant;
  clearInterval(minuteur);

  minuteur = setInterval(() => {
    tempsRestant--;
    document.getElementById('time-left').textContent = tempsRestant;

    if (tempsRestant <= 0) {
      clearInterval(minuteur);
      validerReponse(-1);
    }
  }, 1000);
}

function validerReponse(indexChoisi) {
  clearInterval(minuteur);

  const boutons = document.querySelectorAll('.choice-btn');
  boutons.forEach((bouton, i) => {
    bouton.disabled = true;
    if (i === questionActuelle.bonne) {
      bouton.classList.add('correct');
    } else if (i === indexChoisi) {
      bouton.classList.add('wrong');
    }
  });

  if (indexChoisi === questionActuelle.bonne) {
    score++;
    document.getElementById('score-value').textContent = score;
    mettreAJourMeilleurScore();
  }

  setTimeout(() => {
    afficherQuestion();
  }, 1500);
}

async function demarrer() {
    chargerMeilleurScore();
    await chargerMeilleurScore();
    afficherQuestion();
}

demarrer();
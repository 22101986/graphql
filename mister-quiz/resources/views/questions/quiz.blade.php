@extends('app')

@section('content')

<div class="main-img">
    <div class="container mt-5 text-center">
        <div id="quiz-container" class="card p-4 shadow-sm">
            <div class="card-body">
                
                <!-- <form method="POST" action="{{ route('quiz.submitAnswer') }}"> -->
                <!-- @csrf -->
                <h4 id="question-number" class="text-center mb-4"></h4> 
                <img src="{{ asset('images/mister_quiz.png') }}" style="max-width: 200px; width: 100%; height: auto;" alt="">

                <h2 id="category" class="card-title text-primary text-center mb-4"></h2> 
                <h4 id="xp" class="card-title text-success text-center mb-4"></h4> 

                <h3 id="question-text" class="card-title text-center mb-4"></h3> 
                <ul id="answer-buttons" class="list-unstyled">
                    <!-- Réponses générées ici -->
                </ul>
                <div class="d-flex justify-content-center mt-4">
                <button type="submit"id="next-button" class="btn btn-primary" style="display:none;">Next question</button> 
                    
                </div>
                <!-- </form> -->
            </div>
        </div>
        <button class="btn btn-light m-3 p-3" onclick="window.location.href='{{ route('home') }}'">Back to home</button> 
    </div>
</div>

<script>
    let currentQuestionIndex = 0;
    let questions = [];
    let selectedAnswerId = null;

    function loadQuestions() {
        fetch('/quiz/get-questions')
            .then(response => response.json())
            .then(data => {
                console.log("Questions reçues:", data); 
                questions = data;
                loadQuestion(currentQuestionIndex);
            })
            .catch(error => console.error('Erreur lors du chargement des questions:', error)); 
    }

    function loadQuestion(index) {
        if (index >= questions.length) {
            document.getElementById('quiz-container').innerHTML = '<p>Fin du quiz !</p>';
            return;
        }

        let questionData = questions[index];
        
        // Correction de l'interpolation
        document.getElementById('question-number').innerText = `Question ${index + 1}/${questions.length}`;
        document.getElementById('category').innerText = questionData.category + ":";
        document.getElementById('question-text').innerText = questionData.question;
        document.getElementById('xp').innerText = "XP: +" + questionData.xp;

        const answerButtons = document.getElementById('answer-buttons');
        answerButtons.innerHTML = ''; 

        questionData.answers.forEach(answer => {
            const button = document.createElement('button');
            button.className = 'answer-button btn btn-dark m-2 p-2';
            button.innerText = answer.answer;
            button.dataset.answerId = answer.id; 
            answerButtons.appendChild(button);
        });

        document.getElementById('next-button').style.display = 'none';
        selectedAnswerId = null; 
    }

    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('answer-button')) {
            const answerButtons = document.querySelectorAll('.answer-button');

            // Désélectionner toutes les réponses
            answerButtons.forEach(button => button.classList.remove('selected'));

            // Sélectionner l'élément cliqué
            event.target.classList.add('selected');
            selectedAnswerId = event.target.dataset.answerId; // Stocker l'ID de la réponse sélectionnée

            // Afficher le bouton "Next question"
            document.getElementById('next-button').style.display = 'block';

            // Modifier le texte du bouton si c'est la dernière question
            if (currentQuestionIndex === questions.length - 1) {
                document.getElementById('next-button').innerText = 'Submit';
            } else {
                document.getElementById('next-button').innerText = 'Next question';
            }
        }
    });

    // Gérer le clic sur le bouton "Next question" ou "Submit"
    document.getElementById('next-button').addEventListener('click', function () {
        if (selectedAnswerId !== null) {
            // Soumettre la réponse avant de passer à la suivante
            submitAnswer(selectedAnswerId);
        } else {
            console.error('Aucune réponse sélectionnée');
        }

        // Vérifier si c'est la dernière question
        if (currentQuestionIndex === questions.length - 1) {
            document.getElementById('quiz-container').innerHTML = '<p>Fin du quiz !</p>';
        } else {
            // Passer à la question suivante
            currentQuestionIndex++;
            loadQuestion(currentQuestionIndex);
        }
    });

    function submitAnswer(answerId) {
        let token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        fetch(`{{ route('quiz.submitAnswer') }}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token // Ajouter le token CSRF ici
            },
            body: JSON.stringify({ answer_id: answerId })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la soumission: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Réponse soumise avec succès:', data);
        })
        .catch(error => {
            console.error('Erreur lors de la soumission de la réponse:', error);
        });
    }

    loadQuestions();
</script>

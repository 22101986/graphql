<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\Answer;

use App\Models\User;

use Illuminate\Http\Request;

class QuizController extends Controller
{
    public function index()
    {
        return view('questions.quiz');
    }

    public function getQuestion($index)
    {
        $question = Question::with('answers')->skip($index)->first();

        if (!$question) {
            return response()->json(['message' => 'Fin du quiz'], 200);
        }

        return response()->json($question);
    }


    public function getRandomQuestions() {
        $categories = ['Art', 'History', 'Geography', 'Science', 'Sports'];
        $questions = collect();
    
        foreach ($categories as $category) {
            $question = Question::with('answers')->where('category', $category)->inRandomOrder()->first();
            if ($question) {
                $questions->push($question);
            }
        }
    
        $remainingQuestions = Question::with('answers')
                                      ->whereNotIn('id', $questions->pluck('id')->toArray())
                                      ->inRandomOrder()
                                      ->take(20 - $questions->count())
                                      ->get();
    
        $allQuestions = $questions->merge($remainingQuestions);
    
        return response()->json($allQuestions);
    }

    public function submitAnswer(Request $request){

        \Log::info('Réponse reçue:', $request->all());

        $answerId = $request->input('answer_id');
        $answer = Answer::with('question')->find($answerId);
        var_dump($answer);
    
        if ($answer) {
            $question = $answer->question;

            $user = auth()->user();
        
            $categoryColumn = strtolower($question->category); 

            [$correct, $total] = explode('/', $user->$categoryColumn);

            $total++;

            if ($answer->correct == 1) {

                $user->xp += $question->xp;

                $correct++;
        }

        $user->$categoryColumn = "$correct/$total";

        $user->save();

        return response()->json(['message' => 'Réponse soumise avec succès', 'xp' => $user->xp]);
    }

    return response()->json(['message' => 'Réponse non trouvée ou invalide'], 400);
}



    

}

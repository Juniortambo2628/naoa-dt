<?php

namespace App\Models;

use App\Models\Concerns\RecordsRevisions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    use HasFactory, RecordsRevisions;

    protected string $revisionModule = 'faqs';

    protected $fillable = ['question', 'answer', 'order'];
}

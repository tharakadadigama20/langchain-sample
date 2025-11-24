#!/bin/bash

# Test script for medical transcription correction tool

echo "🧪 Testing Medical Transcription Correction Tool"
echo "================================================"
echo ""

# Test 1: Basic medical terminology correction
echo "Test 1: Basic Medical Terminology Correction"
echo "---------------------------------------------"
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you correct this transcription?\n\nspeaker_01: \"Patient has hyper tension and diabeetus\"\nspeaker_02: \"Ok, we will prescribe metaformin 500mg and lipator 20mg\"\nspeaker_01: \"Also complaining of chest pain and shortness of breath\"",
    "sessionId": "test-session-1"
  }'

echo -e "\n\n"

# Test 2: Complex medical transcription
echo "Test 2: Complex Medical Transcription"
echo "--------------------------------------"
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Please correct this medical transcription:\n\nspeaker_01: \"Patient complains of migrane and dizzyness\"\nspeaker_02: \"We will do an ecg and blood test\"\nspeaker_01: \"Patient also has astma and takes ibuprofen for pain\"",
    "sessionId": "test-session-2"
  }'

echo -e "\n\n"

# Test 3: Drug names correction
echo "Test 3: Drug Names Correction"
echo "------------------------------"
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Correct this:\n\nspeaker_01: \"Prescribed amoxicilin and omeprazol\"\nspeaker_02: \"Also add asprin for blood thinning\"",
    "sessionId": "test-session-3"
  }'

echo -e "\n\n"
echo "✅ Tests completed!"

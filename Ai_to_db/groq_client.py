"""
Groq API Client with Token Tracking
"""
import os
from groq import Groq
from dotenv import load_dotenv
import json

load_dotenv()

class GroqClient:
    def __init__(self):
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in .env file")
        
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.1-8b-instant"
        self.token_usage = []
    
    def call_ai(self, messages, temperature=0.1, force_json=True):
        """
        Call Groq API and track token usage
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Lower = more deterministic (0.1 recommended for structured output)
            force_json: Whether to force JSON response format
        
        Returns:
            dict: {"response": str, "tokens": {"prompt": int, "completion": int, "total": int}}
        """
        try:
            # Build completion params
            params = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature
            }
            
            # Only add response_format if forcing JSON
            if force_json:
                params["response_format"] = {"type": "json_object"}
            
            completion = self.client.chat.completions.create(**params)
            
            # Extract response
            response_text = completion.choices[0].message.content
            
            # Track token usage
            usage = {
                "prompt": completion.usage.prompt_tokens,
                "completion": completion.usage.completion_tokens,
                "total": completion.usage.total_tokens
            }
            
            self.token_usage.append(usage)
            
            return {
                "response": response_text,
                "tokens": usage
            }
        
        except Exception as e:
            return {
                "response": json.dumps({"error": str(e)}),
                "tokens": {"prompt": 0, "completion": 0, "total": 0}
            }
    
    def get_total_tokens(self):
        """Get cumulative token usage across all calls"""
        if not self.token_usage:
            return {"prompt": 0, "completion": 0, "total": 0}
        
        return {
            "prompt": sum(u["prompt"] for u in self.token_usage),
            "completion": sum(u["completion"] for u in self.token_usage),
            "total": sum(u["total"] for u in self.token_usage)
        }
    
    def print_usage_summary(self):
        """Print detailed token usage report"""
        print("\n" + "="*70)
        print(" TOKEN USAGE REPORT ".center(70, "="))
        print("="*70)
        
        total = self.get_total_tokens()
        
        print(f"\n{'API Call':<15} {'Prompt':<15} {'Completion':<15} {'Total':<15}")
        print("-"*70)
        
        for i, usage in enumerate(self.token_usage, 1):
            print(f"Call {i:<11} {usage['prompt']:<15} {usage['completion']:<15} {usage['total']:<15}")
        
        print("-"*70)
        print(f"{'TOTAL':<15} {total['prompt']:<15} {total['completion']:<15} {total['total']:<15}")
        print("="*70)
        
        # Cost estimation (Groq pricing for llama-3.1-8b-instant is very cheap)
        # Rough estimate: $0.05 per 1M tokens (input) and $0.08 per 1M tokens (output)
        cost = (total['prompt'] * 0.05 / 1_000_000) + (total['completion'] * 0.08 / 1_000_000)
        print(f"\nEstimated Cost: ${cost:.6f}")
        print("="*70 + "\n")

from django.shortcuts import render
from django.contrib.auth.decorators import login_required

def index(request):
    if request.user.is_authenticated:
        return render(request, 'dashboard.html')
    return render(request, 'index.html')

@login_required
def dashboard(request):
    return render(request, 'dashboard.html')

@login_required
def profile(request):
    return render(request, 'profile.html')

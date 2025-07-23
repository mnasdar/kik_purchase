<!DOCTYPE html>
<html lang="en">

<head>
    @include('layouts.shared/title-meta', ['title' => "Login"])

    @include('layouts.shared/head-css')
</head>

<body>

<div class="bg-gradient-to-r from-rose-100 to-teal-100 dark:from-gray-700 dark:via-gray-900 dark:to-black">


    <div class="h-screen w-screen flex justify-center items-center">

        <div class="2xl:w-1/4 lg:w-1/3 md:w-1/2 w-full">
            <div class="card overflow-hidden sm:rounded-md rounded-none">
                <div class="p-6">
                    <a href="{{ route('any', 'index') }}" class="block">
                        <img class="h-6 block dark:hidden" src="/images/logo-dark.png" alt="">
                        <img class="h-6 hidden dark:block" src="/images/logo-light.png" alt="">
                    </a>

                    <form method="POST" action="{{ route('login') }}">
                        @csrf

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-600 dark:text-gray-200 mb-2"
                                   for="LoggingEmailAddress">Email Address</label>
                            <input id="LoggingEmailAddress" class="form-input" type="email"
                                   placeholder="Enter your email" value="konrix@coderthemes.com" name="email">
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-600 dark:text-gray-200 mb-2"
                                   for="loggingPassword">Password</label>
                            <input id="loggingPassword" class="form-input" type="password"
                                   placeholder="Enter your password" value="password" name="password">
                        </div>

                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center">
                                <input type="checkbox" class="form-checkbox rounded" id="checkbox-signin">
                                <label class="ms-2" for="checkbox-signin">Remember me</label>
                            </div>
                            <a href="{{ route('second', ['auth', 'recoverpw']) }}"
                               class="text-sm text-primary border-b border-dashed border-primary">Forget Password ?</a>
                        </div>

                        <div class="flex justify-center mb-6">
                            <button class="btn w-full text-white bg-primary"> Log In</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

</div>

</body>

</html>

# Set the minimum required version of CMake
cmake_minimum_required(VERSION 3.10)
project(RelationalAlgebraMapper VERSION 1.0)

# Set the C++ standard to C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Handle UTF-8 source code correctly
if(MSVC)
    add_compile_options(/utf-8)
else()
    add_compile_options(-fexec-charset=UTF-8 -finput-charset=UTF-8)
endif()

# Add our executable program (NO MORE LIBRARIES!)
add_executable(RelationalAlgebraMapper src/main.cpp)
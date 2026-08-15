import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

# Load custom CSS
def load_css(file_name):
    with open(file_name) as f:
        st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)

# Load data
def load_data(file_path):
    return pd.read_csv(file_path)

# Initialize the app
st.set_page_config(page_title="Emotion Analysis Dashboard", layout="wide")

# Load CSS
load_css('C:\\Users\\karthik\\Desktop\\seed\\style.css')

# Header
st.markdown("""
<header>
    <h1>Emotion Analysis Dashboard</h1>
    <p>Analyze emotions from your Google Meet sessions</p>
</header>
""", unsafe_allow_html=True)

# Load Data
df = load_data('C:\\Users\\karthik\\Desktop\\seed\\cleaned_emotion_log_with_person.csv')

if df is not None:
    st.sidebar.header("Filters")
    
    # Emotion filter
    selected_emotions = st.sidebar.multiselect(
        "Select Emotions",
        options=df['Emotion'].unique(),
        default=df['Emotion'].unique()
    )
    
    # Person filter
    selected_persons = st.sidebar.multiselect(
        "Select Persons",
        options=df['Person'].unique(),
        default=df['Person'].unique()
    )
    
    # Filter data
    filtered_df = df[
        (df['Emotion'].isin(selected_emotions)) & 
        (df['Person'].isin(selected_persons))
    ]
    
    # Layout with columns
    col1, col2 = st.columns((2, 1))

    with col1:
        # Overview of Emotion Distribution
        st.subheader("Emotion Distribution")
        pie_fig = px.pie(
            filtered_df, 
            names='Emotion', 
            title='Emotion Distribution',
            color_discrete_sequence=px.colors.qualitative.Pastel
        )
        st.plotly_chart(pie_fig, use_container_width=True)

        # Emotion Trends Over Time
        st.subheader("Emotion Trends Over Time")
        line_fig = px.line(
            filtered_df, 
            x='Date', 
            y='Emotion', 
            color='Emotion', 
            title='Emotion Trends Over Time', 
            labels={"index": "Count"},
            color_discrete_sequence=px.colors.qualitative.Pastel
        )
        st.plotly_chart(line_fig, use_container_width=True)

    with col2:
        # Emotion Distribution by Person
        st.subheader("Emotion Distribution by Person")
        bar_fig = px.bar(
            filtered_df, 
            x='Person', 
            y='Emotion', 
            color='Emotion', 
            title='Emotion Distribution by Person', 
            barmode='group',
            labels={"index": "Count"},
            color_discrete_sequence=px.colors.qualitative.Pastel
        )
        st.plotly_chart(bar_fig, use_container_width=True)

        # Gauge Chart
        emotion_counts = filtered_df['Emotion'].value_counts().reset_index()
        emotion_counts.columns = ['Emotion', 'Count']
        gauge_fig = go.Figure(go.Indicator(
            mode="gauge+number",
            value=emotion_counts['Count'].max(),
            title={'text': "Most Frequent Emotion Count"},
            gauge={'axis': {'range': [None, len(filtered_df)]}}
        ))
        st.plotly_chart(gauge_fig, use_container_width=True)
    
    # Heatmap for Emotion and Person Correlation Over Time
    st.subheader("Heatmap: Emotion and Person Correlation Over Time")
    pivot_table = filtered_df.pivot_table(index='Date', columns='Person', values='Emotion', aggfunc='count').fillna(0)
    heatmap_fig = px.imshow(pivot_table, aspect='auto', title="Emotion and Person Correlation Over Time")
    st.plotly_chart(heatmap_fig, use_container_width=True)
    
    # Key Metrics
    st.subheader("Key Metrics")
    total_emotions = filtered_df['Emotion'].count()
    unique_emotions = filtered_df['Emotion'].nunique()
    unique_persons = filtered_df['Person'].nunique()

    col1, col2, col3 = st.columns(3)
    col1.metric("Total Emotions", total_emotions)
    col2.metric("Unique Emotions", unique_emotions)
    col3.metric("Unique Persons", unique_persons)

    st.write(filtered_df)

else:
    st.error("Invalid file format. Please upload a CSV file.")

# Footer
st.markdown("""
<footer>
    <p>Powered by Emotion Analysis Team</p>
</footer>
""", unsafe_allow_html=True)
